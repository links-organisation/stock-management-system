package com.shopstock.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Self-service profile edit. Username/fullName can be changed freely;
 * changing the password requires the current password to be supplied and
 * verified.
 */
public record SelfUpdateRequest(

        @NotNull UUID userId,

        String username,

        String fullName,

        String currentPassword,

        String newPassword) {
}
