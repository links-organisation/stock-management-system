package com.shopstock.dto.response;

import com.shopstock.entity.OperationType;
import com.shopstock.entity.StockOperation;

import java.time.LocalDateTime;
import java.util.UUID;

public class StockOperationResponse {

    private final UUID id;
    private final OperationType operationType;
    private final UUID productId;
    private final String productName;
    private final Integer quantityChange;
    private final LocalDateTime operationDate;
    private final String comment;
    private final UUID performedByUserId;
    private final String performedByUsername;

    public StockOperationResponse(StockOperation operation) {
        this.id = operation.getId();
        this.operationType = operation.getOperationType();
        this.productId = operation.getProduct().getId();
        this.productName = operation.getProduct().getName();
        this.quantityChange = operation.getQuantityChange();
        this.operationDate = operation.getOperationDate();
        this.comment = operation.getComment();
        this.performedByUserId = operation.getPerformedBy().getId();
        this.performedByUsername = operation.getPerformedBy().getUsername();
    }

    public UUID getId() {
        return id;
    }

    public OperationType getOperationType() {
        return operationType;
    }

    public UUID getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public LocalDateTime getOperationDate() {
        return operationDate;
    }

    public String getComment() {
        return comment;
    }

    public UUID getPerformedByUserId() {
        return performedByUserId;
    }

    public String getPerformedByUsername() {
        return performedByUsername;
    }
}
