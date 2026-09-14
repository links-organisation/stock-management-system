package com.shopstock.dto.response;

import com.shopstock.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        String invoiceNumber,
        LocalDateTime invoiceDate,
        UUID saleId,
        BigDecimal totalAmount,
        SaleResponse sale
) {
    public InvoiceResponse(Invoice invoice) {
        this(invoice, false);
    }

    public InvoiceResponse(Invoice invoice, boolean includeSaleDetail) {
        this(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getInvoiceDate(),
                invoice.getSale().getId(),
                invoice.getTotalAmount(),
                includeSaleDetail ? new SaleResponse(invoice.getSale()) : null
        );
    }
}
