package com.shopstock.dto.response;

import com.shopstock.entity.OperationType;
import com.shopstock.entity.StockOperation;

import java.time.LocalDateTime;

public class StockOperationResponse {

    private Long id;
    private OperationType operationType;
    private Long productId;
    private String productName;
    private Integer quantityChange;
    private LocalDateTime operationDate;
    private String comment;
    private Long performedByUserId;
    private String performedByUsername;

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

    public Long getId() {
        return id;
    }

    public OperationType getOperationType() {
        return operationType;
    }

    public Long getProductId() {
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

    public Long getPerformedByUserId() {
        return performedByUserId;
    }

    public String getPerformedByUsername() {
        return performedByUsername;
    }
}
