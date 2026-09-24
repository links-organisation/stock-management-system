package com.shopstock.controller;

import com.shopstock.service.SystemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    private final SystemService systemService;

    public SystemController(SystemService systemService) {
        this.systemService = systemService;
    }

    @PostMapping("/shutdown")
    public ResponseEntity<Void> shutdown(@RequestParam UUID userId) {
        systemService.shutdown(userId);
        return ResponseEntity.ok().build();
    }
}
