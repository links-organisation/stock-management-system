package com.shopstock.dto.response;

import com.shopstock.entity.Product;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String reference,
        UUID categoryId,
        String categoryName,
        String categoryPrefix,
        BigDecimal purchasePrice,
        BigDecimal sellingPrice,
        Integer quantityInStock,
        Integer alertThreshold,
        boolean lowStock
) {

    public ProductResponse(Product product) {
        this(
                product.getId(),
                product.getName(),
                product.getReference(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getCategory() != null ? product.getCategory().getPrefix() : null,
                product.getPurchasePrice(),
                product.getSellingPrice(),
                product.getQuantityInStock(),
                product.getAlertThreshold(),
                product.getQuantityInStock() != null
                        && product.getAlertThreshold() != null
                        && product.getQuantityInStock() < product.getAlertThreshold()
        );
    }
}
