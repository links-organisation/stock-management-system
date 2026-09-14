package com.shopstock.dto.request;

import com.shopstock.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateUserRequest(

        @NotNull UUID actorUserId,

        @NotBlank String username,

        @NotBlank String password,

        @NotBlank String fullName,

        @NotNull Role role
) {
}
