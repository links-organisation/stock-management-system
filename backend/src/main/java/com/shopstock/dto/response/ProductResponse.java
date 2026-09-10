package com.shopstock.dto.response;

import com.shopstock.entity.Product;

import java.math.BigDecimal;

public class ProductResponse {

    private Long id;
    private String name;
    private String reference;
    private Long categoryId;
    private String categoryName;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private Integer quantityInStock;
    private Integer alertThreshold;
    private boolean lowStock;

    public ProductResponse(Product product) {
        this.id = product.getId();
        this.name = product.getName();
        this.reference = product.getReference();
        if (product.getCategory() != null) {
            this.categoryId = product.getCategory().getId();
            this.categoryName = product.getCategory().getName();
        }
        this.purchasePrice = product.getPurchasePrice();
        this.sellingPrice = product.getSellingPrice();
        this.quantityInStock = product.getQuantityInStock();
        this.alertThreshold = product.getAlertThreshold();
        this.lowStock = product.getQuantityInStock() != null
                && product.getAlertThreshold() != null
                && product.getQuantityInStock() < product.getAlertThreshold();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getReference() {
        return reference;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public Integer getQuantityInStock() {
        return quantityInStock;
    }

    public Integer getAlertThreshold() {
        return alertThreshold;
    }

    public boolean isLowStock() {
        return lowStock;
    }
}
