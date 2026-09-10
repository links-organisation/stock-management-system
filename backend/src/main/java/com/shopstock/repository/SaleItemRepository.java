package com.shopstock.repository;

import com.shopstock.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    List<SaleItem> findByProductId(UUID productId);

    boolean existsByProductId(UUID productId);
}
