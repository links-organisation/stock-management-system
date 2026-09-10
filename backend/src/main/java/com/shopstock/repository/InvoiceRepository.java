package com.shopstock.repository;

import com.shopstock.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findBySaleId(UUID saleId);

    long countByInvoiceNumberStartingWith(String prefix);
}
