package com.shopstock.repository;

import com.shopstock.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByCategoryId(UUID categoryId);

    Optional<Product> findByReference(String reference);

    @Query("select p from Product p where p.reference ilike ?1%")
    List<Product> findByRefPrefix(String reference);

    List<Product> findByQuantityInStockLessThan(Integer threshold);

    List<Product> findByNameContainingIgnoreCaseOrReferenceContainingIgnoreCase(String name, String reference);
}
