package com.shopstock.controller;

import com.shopstock.dto.request.AdjustmentRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/adjust")
    public ProductResponse adjust(@Valid @RequestBody AdjustmentRequest request) {
        return inventoryService.adjust(request);
    }
}
