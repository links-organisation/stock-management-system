package com.shopstock.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AdjustmentRequest(

        @NotNull UUID productId,

        @NotNull Integer newQuantity,

        String comment,

        @NotNull UUID userId
) { }
