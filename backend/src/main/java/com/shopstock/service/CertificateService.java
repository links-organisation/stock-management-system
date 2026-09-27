package com.shopstock.service;

import com.shopstock.exception.CertificateGenerationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);
    private static final int IP_ADDRESS_SAN_TYPE = 7;

    public static final String ALIAS = "stockroom";

    private final LanAddressResolver lanAddressResolver;
    private final Path certificatesDir;
    private final Path keystorePath;
    private final Path passwordPath;
    private final Path pemPath;
    private final Path keytoolOverride;

    @Autowired
    public CertificateService(
            LanAddressResolver lanAddressResolver,
            @Value("${application.certificates.dir:${user.home}/.stockroom/certificates}") String certificatesDir) {
        this(lanAddressResolver, certificatesDir, null);
    }

    /** Package-private: lets tests force a "keytool not found" path deterministically. */
    CertificateService(LanAddressResolver lanAddressResolver, String certificatesDir, Path keytoolOverride) {
        this.lanAddressResolver = lanAddressResolver;
        this.certificatesDir = Path.of(certificatesDir);
        this.keystorePath = this.certificatesDir.resolve("keystore.p12");
        this.passwordPath = this.certificatesDir.resolve("keystore.pass");
        this.pemPath = this.certificatesDir.resolve("stockroom-cert.pem");
        this.keytoolOverride = keytoolOverride;
    }

    /**
     * Ensures a valid HTTPS certificate/keystore exists for the current LAN addresses,
     * (re)generating it if missing or stale. Never throws - any failure is logged and
     * reported as false so the caller can fall back to HTTP-only.
     */
    public boolean ensureHttpsReady() {
        try {
            Files.createDirectories(certificatesDir);
            List<String> ips = currentIps();
            if (!hasCertificate() || !sanCovers(ips)) {
                regenerate(ips);
            }
            return true;
        } catch (Exception e) {
            log.warn("Unable to provision HTTPS certificate; continuing HTTP-only.", e);
            return false;
        }
    }

    public boolean hasCertificate() {
        return Files.exists(keystorePath) && Files.exists(pemPath);
    }

    public boolean certificateCoversCurrentAddresses() {
        try {
            return hasCertificate() && sanCovers(currentIps());
        } catch (Exception e) {
            return false;
        }
    }

    public Optional<Path> getCertificatePemPath() {
        return hasCertificate() ? Optional.of(pemPath) : Optional.empty();
    }

    public Path getKeystorePath() {
        return keystorePath;
    }

    public String getKeystorePassword() throws IOException {
        return Files.readString(passwordPath).trim();
    }

    private List<String> currentIps() {
        return lanAddressResolver.getEligibleAddresses().stream()
                .map(LanAddressResolver.LanAddress::ip)
                .distinct()
                .toList();
    }

    private boolean sanCovers(List<String> ips) {
        try (InputStream in = Files.newInputStream(pemPath)) {
            X509Certificate cert = (X509Certificate)
                    CertificateFactory.getInstance("X.509").generateCertificate(in);
            Set<String> sanIps = new HashSet<>();
            Collection<List<?>> sans = cert.getSubjectAlternativeNames();
            if (sans != null) {
                for (List<?> entry : sans) {
                    if (entry.get(0) instanceof Integer type && type == IP_ADDRESS_SAN_TYPE) {
                        sanIps.add((String) entry.get(1));
                    }
                }
            }
            return sanIps.containsAll(ips);
        } catch (Exception e) {
            return false;
        }
    }

    private void regenerate(List<String> ips) throws IOException, InterruptedException {
        Path keytool = resolveKeytool();
        String password = loadOrCreatePassword();
        // keytool -genkeypair can't be told non-interactively to overwrite an existing
        // alias, so a stale keystore/cert from a previous LAN-IP set must be removed first.
        Files.deleteIfExists(keystorePath);
        Files.deleteIfExists(pemPath);
        runKeytool(genKeyPairCommand(keytool, password, ips));
        runKeytool(exportCertCommand(keytool, password));
    }

    private Path resolveKeytool() {
        if (keytoolOverride != null) {
            return keytoolOverride;
        }
        Path javaBin = Path.of(System.getProperty("java.home"), "bin");
        return Stream.of("keytool", "keytool.exe")
                .map(javaBin::resolve)
                .filter(Files::isRegularFile)
                .findFirst()
                .orElseThrow(() -> new CertificateGenerationException("keytool not found under " + javaBin));
    }

    private List<String> genKeyPairCommand(Path keytool, String password, List<String> ips) {
        String san = Stream.concat(Stream.of("dns:localhost", "ip:127.0.0.1"), ips.stream().map(ip -> "ip:" + ip))
                .collect(Collectors.joining(","));
        // ProcessBuilder(List) never goes through a shell, so the SAN value must NOT be
        // quoted here even though keytool's own CLI docs show it quoted for interactive use.
        return List.of(keytool.toString(), "-genkeypair",
                "-alias", ALIAS, "-keyalg", "RSA", "-keysize", "2048", "-validity", "825",
                "-storetype", "PKCS12", "-keystore", keystorePath.toString(),
                "-storepass", password, "-keypass", password,
                "-dname", "CN=Stockroom Local Network, OU=Stockroom, O=Stockroom, C=US",
                "-ext", "SAN=" + san);
    }

    private List<String> exportCertCommand(Path keytool, String password) {
        return List.of(keytool.toString(), "-exportcert", "-rfc",
                "-alias", ALIAS, "-keystore", keystorePath.toString(),
                "-storepass", password, "-storetype", "PKCS12", "-file", pemPath.toString());
    }

    private void runKeytool(List<String> command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command).redirectErrorStream(true);
        Process process = pb.start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        boolean finished = process.waitFor(30, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new CertificateGenerationException("keytool timed out");
        }
        if (process.exitValue() != 0) {
            throw new CertificateGenerationException("keytool exited " + process.exitValue() + ": " + output);
        }
    }

    private String loadOrCreatePassword() throws IOException {
        if (Files.exists(passwordPath)) {
            return Files.readString(passwordPath).trim();
        }
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String password = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Files.writeString(passwordPath, password);
        try {
            Files.setPosixFilePermissions(passwordPath, PosixFilePermissions.fromString("rw-------"));
        } catch (UnsupportedOperationException ignored) {
            // Non-POSIX filesystem (e.g. Windows) - best-effort only.
        }
        return password;
    }
}
