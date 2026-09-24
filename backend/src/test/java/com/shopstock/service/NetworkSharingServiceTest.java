package com.shopstock.service;

import com.shopstock.dto.response.NetworkInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NetworkSharingServiceTest {

    @Mock
    private NetworkInterfaceProvider networkInterfaceProvider;

    private NetworkSharingService networkSharingService;

    @BeforeEach
    void setUp() {
        networkSharingService = new NetworkSharingService(networkInterfaceProvider, 8080);
    }

    private NetworkInterface eligibleInterface(String displayName) throws SocketException {
        NetworkInterface iface = org.mockito.Mockito.mock(NetworkInterface.class);
        lenient().when(iface.isUp()).thenReturn(true);
        lenient().when(iface.isLoopback()).thenReturn(false);
        lenient().when(iface.isVirtual()).thenReturn(false);
        lenient().when(iface.getDisplayName()).thenReturn(displayName);
        return iface;
    }

    private Inet4Address eligibleAddress(String ip) {
        Inet4Address address = org.mockito.Mockito.mock(Inet4Address.class);
        lenient().when(address.isLoopbackAddress()).thenReturn(false);
        lenient().when(address.isLinkLocalAddress()).thenReturn(false);
        lenient().when(address.getHostAddress()).thenReturn(ip);
        return address;
    }

    private void withAddresses(NetworkInterface iface, InetAddress... addresses) {
        Enumeration<InetAddress> enumeration = Collections.enumeration(List.of(addresses));
        when(iface.getInetAddresses()).thenReturn(enumeration);
    }

    @Test
    void getNetworkInfo_excludesLoopbackInterface() throws SocketException {
        NetworkInterface loopback = eligibleInterface("lo");
        when(loopback.isLoopback()).thenReturn(true);
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of(loopback));

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.addresses()).isEmpty();
        assertThat(info.enabled()).isFalse();
    }

    @Test
    void getNetworkInfo_excludesVirtualInterface() throws SocketException {
        NetworkInterface virtual = eligibleInterface("docker0");
        when(virtual.isVirtual()).thenReturn(true);
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of(virtual));

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.addresses()).isEmpty();
    }

    @Test
    void getNetworkInfo_excludesDownInterface() throws SocketException {
        NetworkInterface down = eligibleInterface("eth0");
        when(down.isUp()).thenReturn(false);
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of(down));

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.addresses()).isEmpty();
    }

    @Test
    void getNetworkInfo_excludesIpv6OnlyAddresses() throws SocketException {
        NetworkInterface iface = eligibleInterface("eth0");
        Inet6Address ipv6 = org.mockito.Mockito.mock(Inet6Address.class);
        withAddresses(iface, ipv6);
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of(iface));

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.addresses()).isEmpty();
    }

    @Test
    void getNetworkInfo_excludesLinkLocalAddresses() throws SocketException {
        NetworkInterface iface = eligibleInterface("eth0");
        Inet4Address linkLocal = org.mockito.Mockito.mock(Inet4Address.class);
        when(linkLocal.isLoopbackAddress()).thenReturn(false);
        when(linkLocal.isLinkLocalAddress()).thenReturn(true);
        withAddresses(iface, linkLocal);
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of(iface));

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.addresses()).isEmpty();
    }

    @Test
    void getNetworkInfo_returnsOneAddress_forSingleEligibleInterface() throws SocketException {
        NetworkInterface iface = eligibleInterface("Wi-Fi");
        Inet4Address address = eligibleAddress("192.168.1.15");
        withAddresses(iface, address);
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of(iface));

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.enabled()).isTrue();
        assertThat(info.https()).isFalse();
        assertThat(info.port()).isEqualTo(8080);
        assertThat(info.addresses()).hasSize(1);
        assertThat(info.addresses().getFirst().interfaceName()).isEqualTo("Wi-Fi");
        assertThat(info.addresses().getFirst().ip()).isEqualTo("192.168.1.15");
        assertThat(info.addresses().getFirst().url()).isEqualTo("http://192.168.1.15:8080");
    }

    @Test
    void getNetworkInfo_returnsAllAddresses_forMultipleEligibleInterfaces() throws SocketException {
        NetworkInterface wifi = eligibleInterface("Wi-Fi");
        withAddresses(wifi, eligibleAddress("192.168.1.15"));
        NetworkInterface ethernet = eligibleInterface("Ethernet");
        withAddresses(ethernet, eligibleAddress("192.168.1.20"));
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of(wifi, ethernet));

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.addresses()).hasSize(2);
        assertThat(info.addresses()).extracting("ip").containsExactlyInAnyOrder("192.168.1.15", "192.168.1.20");
    }

    @Test
    void getNetworkInfo_returnsDisabled_whenNoEligibleInterfacesExist() throws SocketException {
        when(networkInterfaceProvider.getNetworkInterfaces()).thenReturn(List.of());

        NetworkInfo info = networkSharingService.getNetworkInfo();

        assertThat(info.enabled()).isFalse();
        assertThat(info.https()).isFalse();
        assertThat(info.addresses()).isEmpty();
    }

    @Test
    void getNetworkInfo_wrapsSocketException_asIllegalStateException() throws SocketException {
        when(networkInterfaceProvider.getNetworkInterfaces()).thenThrow(new SocketException("boom"));

        assertThatThrownBy(() -> networkSharingService.getNetworkInfo())
                .isInstanceOf(IllegalStateException.class)
                .hasCauseInstanceOf(SocketException.class);
    }
}
