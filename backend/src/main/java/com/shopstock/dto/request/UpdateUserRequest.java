package com.shopstock.dto.request;

import com.shopstock.entity.Role;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Admin-side edit of another user: username/password/fullName/role are all
 * optional so the caller can update just the fields it sent.
 */
public class UpdateUserRequest {

    @NotNull
    private UUID actorUserId;

    private String username;

    private String password;

    private String fullName;

    private Role role;

    public UUID getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(UUID actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
