package com.shopstock.controller;

import com.shopstock.dto.response.NetworkInfo;
import com.shopstock.service.NetworkSharingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/network")
public class NetworkController {

    private final NetworkSharingService networkSharingService;

    public NetworkController(NetworkSharingService networkSharingService) {
        this.networkSharingService = networkSharingService;
    }

    @GetMapping("/info")
    public ResponseEntity<NetworkInfo> getNetworkInfo() {
        return ResponseEntity.ok(networkSharingService.getNetworkInfo());
    }
}
