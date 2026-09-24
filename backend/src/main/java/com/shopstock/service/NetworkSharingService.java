package com.shopstock.service;

import com.shopstock.dto.response.NetworkAddress;
import com.shopstock.dto.response.NetworkInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class NetworkSharingService {

    private final NetworkInterfaceProvider networkInterfaceProvider;
    private final int serverPort;

    public NetworkSharingService(NetworkInterfaceProvider networkInterfaceProvider,
                                  @Value("${server.port:8080}") int serverPort) {
        this.networkInterfaceProvider = networkInterfaceProvider;
        this.serverPort = serverPort;
    }

    public NetworkInfo getNetworkInfo() {
        List<NetworkAddress> addresses = new ArrayList<>();

        try {
            for (NetworkInterface networkInterface : networkInterfaceProvider.getNetworkInterfaces()) {
                if (!isEligible(networkInterface)) {
                    continue;
                }
                for (InetAddress address : Collections.list(networkInterface.getInetAddresses())) {
                    if (!isEligibleAddress(address)) {
                        continue;
                    }
                    String ip = address.getHostAddress();
                    String url = "http://" + ip + ":" + serverPort;
                    addresses.add(new NetworkAddress(networkInterface.getDisplayName(), ip, url));
                }
            }
        } catch (SocketException e) {
            throw new IllegalStateException("Unable to enumerate network interfaces", e);
        }

        return new NetworkInfo(!addresses.isEmpty(), false, serverPort, addresses);
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
