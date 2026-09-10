package com.shopstock.controller;

import com.shopstock.dto.response.StockOperationResponse;
import com.shopstock.entity.OperationType;
import com.shopstock.service.StockOperationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-operations")
public class StockOperationController {

    private final StockOperationService stockOperationService;

    public StockOperationController(StockOperationService stockOperationService) {
        this.stockOperationService = stockOperationService;
    }

    @GetMapping
    public List<StockOperationResponse> getAll(@RequestParam(required = false) Long productId,
                                                @RequestParam(required = false) OperationType type,
                                                @RequestParam(required = false) Long userId) {
        return stockOperationService.findAll(productId, type, userId);
    }
}
