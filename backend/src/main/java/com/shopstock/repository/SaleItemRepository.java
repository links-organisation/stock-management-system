package com.shopstock.repository;

import com.shopstock.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findByProductId(Long productId);

    boolean existsByProductId(Long productId);
}
