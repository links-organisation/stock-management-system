package com.shopstock.dto.response;

import com.shopstock.entity.Sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class SaleResponse {

    private Long id;
    private LocalDateTime saleDate;
    private BigDecimal totalAmount;
    private String customerName;
    private Long performedByUserId;
    private String performedByUsername;
    private List<SaleItemResponse> items;

    public SaleResponse(Sale sale) {
        this.id = sale.getId();
        this.saleDate = sale.getSaleDate();
        this.totalAmount = sale.getTotalAmount();
        this.customerName = sale.getCustomerName();
        this.performedByUserId = sale.getPerformedBy().getId();
        this.performedByUsername = sale.getPerformedBy().getUsername();
        this.items = sale.getItems().stream().map(SaleItemResponse::new).collect(Collectors.toList());
    }

    public Long getId() {
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

    public Long getPerformedByUserId() {
        return performedByUserId;
    }

    public String getPerformedByUsername() {
        return performedByUsername;
    }

    public List<SaleItemResponse> getItems() {
        return items;
    }
}
