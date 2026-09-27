package com.shopstock.service;

import com.shopstock.dto.response.NetworkInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NetworkSharingServiceTest {

    @Mock
    private LanAddressResolver lanAddressResolver;
    @Mock
    private CertificateService certificateService;

    private NetworkSharingService networkSharingService;

    private static final LanAddressResolver.LanAddress WIFI =
            new LanAddressResolver.LanAddress("Wi-Fi", "192.168.1.15");

    @BeforeEach
    void setUp() {
        networkSharingService = new NetworkSharingService(lanAddressResolver, certificateService, 8080, 8443);
    }

    @Test
    void getNetworkInfo_usesHttpUrls_whenHttpsUnavailable() {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));
        when(certificateService.hasCertificate()).thenReturn(false);

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.enabled()).isTrue();
        assertThat(info.https()).isFalse();
        assertThat(info.certificateValid()).isFalse();
        assertThat(info.port()).isEqualTo(8080);
        assertThat(info.addresses()).hasSize(1);
        assertThat(info.addresses().getFirst().url()).isEqualTo("http://192.168.1.15:8080");
    }

    @Test
    void getNetworkInfo_usesHttpsUrls_whenCertificateExistsAndIsValid() {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));
        when(certificateService.hasCertificate()).thenReturn(true);
        when(certificateService.certificateCoversCurrentAddresses()).thenReturn(true);

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.https()).isTrue();
        assertThat(info.certificateValid()).isTrue();
        assertThat(info.port()).isEqualTo(8443);
        assertThat(info.addresses().getFirst().url()).isEqualTo("https://192.168.1.15:8443");
    }

    @Test
    void getNetworkInfo_fallsBackToHttp_whenCertificateExistsButIsStale() {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of(WIFI));
        when(certificateService.hasCertificate()).thenReturn(true);
        when(certificateService.certificateCoversCurrentAddresses()).thenReturn(false);

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.https()).isTrue();
        assertThat(info.certificateValid()).isFalse();
        assertThat(info.port()).isEqualTo(8080);
        assertThat(info.addresses().getFirst().url()).isEqualTo("http://192.168.1.15:8080");
    }

    @Test
    void getNetworkInfo_returnsDisabled_whenNoAddressesDetected() {
        when(lanAddressResolver.getEligibleAddresses()).thenReturn(List.of());
        when(certificateService.hasCertificate()).thenReturn(false);

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.enabled()).isFalse();
        assertThat(info.addresses()).isEmpty();
    }
}
