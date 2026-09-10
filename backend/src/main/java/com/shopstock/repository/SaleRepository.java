package com.shopstock.repository;

import com.shopstock.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

    List<Sale> findByPerformedById(UUID userId);

    List<Sale> findBySaleDateBetween(LocalDateTime start, LocalDateTime end);
}
