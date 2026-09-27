package com.shopstock.service;

import com.shopstock.dto.response.NetworkAddress;
import com.shopstock.dto.response.NetworkInfo;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NetworkSharingService {

    private final LanAddressResolver lanAddressResolver;
    private final CertificateService certificateService;
    private final int serverPort;
    private final int httpsPort;

    public NetworkSharingService(LanAddressResolver lanAddressResolver,
                                  CertificateService certificateService,
                                  @Value("${server.port:8080}") int serverPort,
                                  @Value("${application.https.port:8443}") int httpsPort) {
        this.lanAddressResolver = lanAddressResolver;
        this.certificateService = certificateService;
        this.serverPort = serverPort;
        this.httpsPort = httpsPort;
    }

    public NetworkInfo getNetworkInfo() {
        boolean https = certificateService.hasCertificate();
        boolean certificateValid = https && certificateService.certificateCoversCurrentAddresses();
        boolean useHttps = https && certificateValid;
        String scheme = useHttps ? "https" : "http";
        int effectivePort = useHttps ? httpsPort : serverPort;

        List<NetworkAddress> addresses = createAddresses(scheme, effectivePort);

        return new NetworkInfo(!addresses.isEmpty(), https, certificateValid, effectivePort, addresses);
    }

    private @NonNull List<NetworkAddress> createAddresses(String scheme, int effectivePort) {
        List<NetworkAddress> addresses = new ArrayList<>();
        for (LanAddressResolver.LanAddress address : lanAddressResolver.getEligibleAddresses()) {
            String url = scheme + "://" + address.ip() + ":" + effectivePort;
            String url2 = "http://" + address.ip() + ":" + serverPort;

            addresses.add(new NetworkAddress(address.interfaceName(), address.ip(), url));
            if (serverPort != effectivePort)
                addresses.add(new NetworkAddress(address.interfaceName(), address.ip(), url2));
        }
        return addresses;
    }
}
