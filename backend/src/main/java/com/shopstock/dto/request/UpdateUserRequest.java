package com.shopstock.dto.request;

import com.shopstock.entity.Role;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Admin-side edit of another user: username/password/fullName/role are all
 * optional so the caller can update just the fields it sent.
 */
public record UpdateUserRequest(

        @NotNull UUID actorUserId,

        String username,

        String password,

        String fullName,

        Role role
) {
}
