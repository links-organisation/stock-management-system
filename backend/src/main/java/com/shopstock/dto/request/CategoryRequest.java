package com.shopstock.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CategoryRequest(

        @NotBlank String name,

        @NotBlank String prefix,

        String description,

        @NotNull UUID userId
) {
}
