package com.shopstock.dto.response;

import com.shopstock.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class InvoiceResponse {

    private final UUID id;
    private final String invoiceNumber;
    private final LocalDateTime invoiceDate;
    private final UUID saleId;
    private final BigDecimal totalAmount;
    private SaleResponse sale;

    public InvoiceResponse(Invoice invoice) {
        this(invoice, false);
    }

    public InvoiceResponse(Invoice invoice, boolean includeSaleDetail) {
        this.id = invoice.getId();
        this.invoiceNumber = invoice.getInvoiceNumber();
        this.invoiceDate = invoice.getInvoiceDate();
        this.saleId = invoice.getSale().getId();
        this.totalAmount = invoice.getTotalAmount();
        if (includeSaleDetail) {
            this.sale = new SaleResponse(invoice.getSale());
        }
    }

    public UUID getId() {
        return id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public LocalDateTime getInvoiceDate() {
        return invoiceDate;
    }

    public UUID getSaleId() {
        return saleId;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public SaleResponse getSale() {
        return sale;
    }
}
