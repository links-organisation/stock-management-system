package com.shopstock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductRequest(

        @NotBlank String name,

        @NotBlank String reference,

        UUID categoryId,

        @NotNull @Min(0) BigDecimal purchasePrice,

        @NotNull @Min(0) BigDecimal sellingPrice,

        @NotNull @Min(0) Integer quantityInStock,

        @NotNull @Min(0) Integer alertThreshold,

        @NotNull UUID userId
) {
}
