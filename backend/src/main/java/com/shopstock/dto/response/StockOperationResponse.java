package com.shopstock.dto.response;

import com.shopstock.entity.OperationType;
import com.shopstock.entity.StockOperation;

import java.time.LocalDateTime;
import java.util.UUID;

public record StockOperationResponse(
        UUID id,
        OperationType operationType,
        UUID productId,
        String productName,
        Integer quantityChange,
        LocalDateTime operationDate,
        String comment,
        UUID performedByUserId,
        String performedByUsername
) {
    public StockOperationResponse(StockOperation operation) {
        this(operation.getId(), operation.getOperationType(), operation.getProduct().getId(), operation.getProduct().getName(), operation.getQuantityChange(), operation.getOperationDate(), operation.getComment(), operation.getPerformedBy().getId(), operation.getPerformedBy().getUsername());
    }
}
