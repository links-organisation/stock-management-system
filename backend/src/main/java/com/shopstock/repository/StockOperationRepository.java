package com.shopstock.repository;

import com.shopstock.entity.OperationType;
import com.shopstock.entity.StockOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockOperationRepository extends JpaRepository<StockOperation, Long> {

    List<StockOperation> findByProductId(Long productId);

    List<StockOperation> findByOperationType(OperationType operationType);

    List<StockOperation> findByPerformedById(Long userId);

    List<StockOperation> findAllByOrderByOperationDateDesc();

    boolean existsByProductId(Long productId);
}
