package com.shopstock.repository;

import com.shopstock.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryId(Long categoryId);

    Optional<Product> findByReference(String reference);

    List<Product> findByQuantityInStockLessThan(Integer threshold);

    List<Product> findByNameContainingIgnoreCaseOrReferenceContainingIgnoreCase(String name, String reference);
}
