package com.shopstock.service;

import org.springframework.stereotype.Component;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class LanAddressResolver {

    public record LanAddress(String interfaceName, String ip) {
    }

    private final NetworkInterfaceProvider networkInterfaceProvider;

    public LanAddressResolver(NetworkInterfaceProvider networkInterfaceProvider) {
        this.networkInterfaceProvider = networkInterfaceProvider;
    }

    public List<LanAddress> getEligibleAddresses() {
        List<LanAddress> addresses = new ArrayList<>();

        try {
            for (NetworkInterface networkInterface : networkInterfaceProvider.getNetworkInterfaces()) {
                if (!isEligible(networkInterface)) {
                    continue;
                }
                for (InetAddress address : Collections.list(networkInterface.getInetAddresses())) {
                    if (!isEligibleAddress(address)) {
                        continue;
                    }
                    addresses.add(new LanAddress(networkInterface.getDisplayName(), address.getHostAddress()));
                }
            }
        } catch (SocketException e) {
            throw new IllegalStateException("Unable to enumerate network interfaces", e);
        }

        return addresses;
    }

    private boolean isEligible(NetworkInterface networkInterface) {
        try {
            return networkInterface.isUp()
                    && !networkInterface.isLoopback()
                    && !networkInterface.isVirtual();
        } catch (SocketException e) {
            return false;
        }
    }

    private boolean isEligibleAddress(InetAddress address) {
        return address instanceof Inet4Address
                && !address.isLoopbackAddress()
                && !address.isLinkLocalAddress();
    }
}
