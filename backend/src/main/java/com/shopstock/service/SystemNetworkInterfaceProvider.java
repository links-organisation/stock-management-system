package com.shopstock.service;

import org.springframework.stereotype.Component;

import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Collections;
import java.util.List;

@Component
public class SystemNetworkInterfaceProvider implements NetworkInterfaceProvider {

    @Override
    public List<NetworkInterface> getNetworkInterfaces() throws SocketException {
        return Collections.list(NetworkInterface.getNetworkInterfaces());
    }
}
