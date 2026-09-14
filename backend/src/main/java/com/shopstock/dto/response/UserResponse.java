package com.shopstock.dto.response;

import com.shopstock.entity.Role;
import com.shopstock.entity.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String fullName,
        Role role
) {
    public UserResponse(User user) {
        this(user.getId(), user.getUsername(), user.getFullName(), user.getRole());
    }
}
