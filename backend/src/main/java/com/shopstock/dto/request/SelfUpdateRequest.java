package com.shopstock.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Self-service profile edit. Username/fullName can be changed freely;
 * changing the password requires the current password to be supplied and
 * verified.
 */
public class SelfUpdateRequest {

    @NotNull
    private UUID userId;

    private String username;

    private String fullName;

    private String currentPassword;

    private String newPassword;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
