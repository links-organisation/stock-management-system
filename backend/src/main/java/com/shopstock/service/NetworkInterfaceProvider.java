package com.shopstock.service;

import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.List;

public interface NetworkInterfaceProvider {
    List<NetworkInterface> getNetworkInterfaces() throws SocketException;
}
