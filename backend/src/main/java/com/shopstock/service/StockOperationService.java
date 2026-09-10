package com.shopstock.service;

import com.shopstock.dto.response.StockOperationResponse;
import com.shopstock.entity.OperationType;
import com.shopstock.entity.StockOperation;
import com.shopstock.repository.StockOperationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StockOperationService {

    private final StockOperationRepository stockOperationRepository;

    public StockOperationService(StockOperationRepository stockOperationRepository) {
        this.stockOperationRepository = stockOperationRepository;
    }

    public List<StockOperationResponse> findAll(Long productId, OperationType type, Long userId,
                                                 LocalDate from, LocalDate to) {
        List<StockOperation> operations = stockOperationRepository.findAllByOrderByOperationDateDesc();

        return operations.stream()
                .filter(op -> productId == null || op.getProduct().getId().equals(productId))
                .filter(op -> type == null || op.getOperationType() == type)
                .filter(op -> userId == null || op.getPerformedBy().getId().equals(userId))
                .filter(op -> from == null || !op.getOperationDate().toLocalDate().isBefore(from))
                .filter(op -> to == null || !op.getOperationDate().toLocalDate().isAfter(to))
                .map(StockOperationResponse::new)
                .collect(Collectors.toList());
    }
}
