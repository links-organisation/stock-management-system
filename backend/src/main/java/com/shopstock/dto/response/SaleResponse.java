package com.shopstock.dto.response;

import com.shopstock.entity.Sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class SaleResponse {

    private final UUID id;
    private final LocalDateTime saleDate;
    private final BigDecimal totalAmount;
    private final String customerName;
    private final UUID performedByUserId;
    private final String performedByUsername;
    private final List<SaleItemResponse> items;

    public SaleResponse(Sale sale) {
        this.id = sale.getId();
        this.saleDate = sale.getSaleDate();
        this.totalAmount = sale.getTotalAmount();
        this.customerName = sale.getCustomerName();
        this.performedByUserId = sale.getPerformedBy().getId();
        this.performedByUsername = sale.getPerformedBy().getUsername();
        this.items = sale.getItems().stream().map(SaleItemResponse::new).collect(Collectors.toList());
    }

    public UUID getId() {
        return id;
    }

    public LocalDateTime getSaleDate() {
        return saleDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getCustomerName() {
        return customerName;
    }

    public UUID getPerformedByUserId() {
        return performedByUserId;
    }

    public String getPerformedByUsername() {
        return performedByUsername;
    }

    public List<SaleItemResponse> getItems() {
        return items;
    }
}
