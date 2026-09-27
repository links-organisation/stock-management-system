package com.shopstock.controller;

import com.shopstock.dto.response.NetworkInfo;
import com.shopstock.service.CertificateService;
import com.shopstock.service.NetworkSharingService;
import com.shopstock.service.QrCodeService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/network")
public class NetworkController {

    private final NetworkSharingService networkSharingService;
    private final CertificateService certificateService;
    private final QrCodeService qrCodeService;

    public NetworkController(NetworkSharingService networkSharingService,
                              CertificateService certificateService,
                              QrCodeService qrCodeService) {
        this.networkSharingService = networkSharingService;
        this.certificateService = certificateService;
        this.qrCodeService = qrCodeService;
    }

    @GetMapping("/info")
    public ResponseEntity<NetworkInfo> getNetworkInfo() {
        return ResponseEntity.ok(networkSharingService.getNetworkInfo());
    }

    @GetMapping("/certificate")
    public ResponseEntity<Resource> downloadCertificate() {
        Optional<Path> pemPath = certificateService.getCertificatePemPath();
        if (pemPath.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(pemPath.get());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/x-pem-file"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"stockroom-cert.pem\"")
                .body(resource);
    }

    @GetMapping("/qrcode")
    public ResponseEntity<byte[]> getQrCode(@RequestParam String url) {
        boolean isKnownAddress = networkSharingService.getNetworkInfo().addresses().stream()
                .anyMatch(address -> address.url().equals(url));
        if (!isKnownAddress) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrCodeService.generatePng(url));
    }
}
