package com.shopstock.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SaleRequest(

        @NotNull UUID userId,

        String customerName,

        @NotEmpty @Valid List<SaleItemRequest> items
) {
}
