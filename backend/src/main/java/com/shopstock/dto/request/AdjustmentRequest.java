package com.shopstock.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AdjustmentRequest {

    @NotNull
    private UUID productId;

    @NotNull
    private Integer newQuantity;

    private String comment;

    @NotNull
    private UUID userId;

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public Integer getNewQuantity() {
        return newQuantity;
    }

    public void setNewQuantity(Integer newQuantity) {
        this.newQuantity = newQuantity;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }
}
