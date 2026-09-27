package com.shopstock.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock
    private LanAddressResolver lanAddressResolver;

    @TempDir
    private Path tempDir;

    private static final LanAddressResolver.LanAddress WIFI =
            new LanAddressResolver.LanAddress("Wi-Fi", "10.0.0.5");
    private static final LanAddressResolver.LanAddress ETHERNET =
            new LanAddressResolver.LanAddress("Ethernet", "10.0.0.9");

    private CertificateService certificateService;

    @BeforeEach
    void setUp() {
        certificateService = new CertificateService(lanAddressResolver, tempDir.toString(), null);
    }

    @Test
    void ensureHttpsReady_generatesKeystoreAndCertificate_whenNoneExistYet() {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));

        boolean ready = certificateService.ensureHttpsReady();

        assertThat(ready).isTrue();
        assertThat(certificateService.hasCertificate()).isTrue();
        assertThat(certificateService.certificateCoversCurrentAddresses()).isTrue();
        assertThat(tempDir.resolve("keystore.p12")).exists();
        assertThat(tempDir.resolve("stockroom-cert.pem")).exists();
    }

    @Test
    void ensureHttpsReady_doesNotRegenerate_whenSanAlreadyCoversCurrentIps() throws IOException {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));
        certificateService.ensureHttpsReady();
        var firstModified = Files.getLastModifiedTime(tempDir.resolve("keystore.p12"));

        certificateService.ensureHttpsReady();

        var secondModified = Files.getLastModifiedTime(tempDir.resolve("keystore.p12"));
        assertThat(secondModified).isEqualTo(firstModified);
    }

    @Test
    void ensureHttpsReady_regenerates_whenLanIpsChange() throws Exception {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));
        certificateService.ensureHttpsReady();

        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(ETHERNET));
        boolean ready = certificateService.ensureHttpsReady();

        assertThat(ready).isTrue();
        Set<String> sanIps = readSanIps(tempDir.resolve("stockroom-cert.pem"));
        assertThat(sanIps).contains("10.0.0.9").doesNotContain("10.0.0.5");
    }

    @Test
    void ensureHttpsReady_returnsFalseAndDoesNotThrow_whenKeytoolIsMissing() {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));
        CertificateService serviceWithMissingKeytool =
                new CertificateService(lanAddressResolver, tempDir.toString(), Path.of("/nonexistent/keytool"));

        boolean ready = serviceWithMissingKeytool.ensureHttpsReady();

        assertThat(ready).isFalse();
        assertThat(serviceWithMissingKeytool.hasCertificate()).isFalse();
    }

    @Test
    void ensureHttpsReady_returnsFalse_whenLanAddressResolverThrows() {
        when(lanAddressResolver.getEligibleAddresses()).thenThrow(new IllegalStateException("boom"));

        boolean ready = certificateService.ensureHttpsReady();

        assertThat(ready).isFalse();
    }

    @Test
    void certificateCoversCurrentAddresses_returnsTrue_whenSanContainsAllCurrentIps() throws IOException {
        seedFixtureCertificate();
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));

        assertThat(certificateService.certificateCoversCurrentAddresses()).isTrue();
    }

    @Test
    void certificateCoversCurrentAddresses_returnsFalse_whenIpMissingFromSan() throws IOException {
        seedFixtureCertificate();
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(ETHERNET));

        assertThat(certificateService.certificateCoversCurrentAddresses()).isFalse();
    }

    @Test
    void hasCertificate_returnsFalse_beforeAnyGeneration() {
        assertThat(certificateService.hasCertificate()).isFalse();
        assertThat(certificateService.getCertificatePemPath()).isEmpty();
    }

    /** Seeds the temp dir with the checked-in fixture PEM (SAN: localhost, 127.0.0.1, 10.0.0.5)
     *  plus a placeholder keystore file, so hasCertificate()/certificateCoversCurrentAddresses()
     *  can be exercised without spawning a keytool process for every SAN-comparison case. */
    private void seedFixtureCertificate() throws IOException {
        Path fixture = Path.of("src/test/resources/certificates/fixture-cert.pem");
        Files.copy(fixture, tempDir.resolve("stockroom-cert.pem"));
        Files.writeString(tempDir.resolve("keystore.p12"), "placeholder");
    }

    private Set<String> readSanIps(Path pemPath) throws Exception {
        try (InputStream in = Files.newInputStream(pemPath)) {
            X509Certificate cert = (X509Certificate)
                    CertificateFactory.getInstance("X.509").generateCertificate(in);
            Set<String> ips = new HashSet<>();
            Collection<List<?>> sans = cert.getSubjectAlternativeNames();
            if (sans != null) {
                for (List<?> entry : sans) {
                    if (entry.get(0) instanceof Integer type && type == 7) {
                        ips.add((String) entry.get(1));
                    }
                }
            }
            return ips;
        }
    }
}
