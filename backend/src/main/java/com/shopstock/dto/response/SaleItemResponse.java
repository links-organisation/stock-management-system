package com.shopstock.dto.response;

import com.shopstock.entity.SaleItem;

import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemResponse(
        UUID id,
        UUID productId,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public SaleItemResponse(SaleItem item) {
        this(item.getId(), item.getProduct().getId(), item.getProduct().getName(), item.getQuantity(), item.getUnitPrice(), item.getSubtotal());
    }
}
