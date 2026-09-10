package com.shopstock.repository;

import com.shopstock.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findBySaleId(Long saleId);

    long countByInvoiceNumberStartingWith(String prefix);
}
