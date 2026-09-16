package com.shopstock.dto.response;

import com.shopstock.entity.Sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record SaleResponse(
        UUID id,
        LocalDateTime saleDate,
        BigDecimal totalAmount,
        String customerName,
        UUID performedByUserId,
        String performedByUsername,
        String performedByFullname,
        List<SaleItemResponse> items
) {
    public SaleResponse(Sale sale) {
        this(sale.getId(), sale.getSaleDate(), sale.getTotalAmount(), sale.getCustomerName(), sale.getPerformedBy().getId(), sale.getPerformedBy().getUsername(), sale.getPerformedBy().getFullName(), sale.getItems().stream().map(SaleItemResponse::new).collect(Collectors.toList()));
    }
}
