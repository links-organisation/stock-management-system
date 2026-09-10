package com.shopstock.repository;

import com.shopstock.entity.OperationType;
import com.shopstock.entity.StockOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StockOperationRepository extends JpaRepository<StockOperation, UUID> {

    List<StockOperation> findByProductId(UUID productId);

    List<StockOperation> findByOperationType(OperationType operationType);

    List<StockOperation> findByPerformedById(UUID userId);

    List<StockOperation> findAllByOrderByOperationDateDesc();

    boolean existsByProductId(UUID productId);
}
