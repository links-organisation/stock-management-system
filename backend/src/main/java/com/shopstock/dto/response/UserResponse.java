package com.shopstock.dto.response;

import com.shopstock.entity.Role;
import com.shopstock.entity.User;

import java.util.UUID;

public class UserResponse {

    private final UUID id;
    private final String username;
    private final String fullName;
    private final Role role;

    public UserResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.fullName = user.getFullName();
        this.role = user.getRole();
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getFullName() {
        return fullName;
    }

    public Role getRole() {
        return role;
    }
}
