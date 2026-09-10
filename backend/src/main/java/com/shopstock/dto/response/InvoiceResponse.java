package com.shopstock.dto.response;

import com.shopstock.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private LocalDateTime invoiceDate;
    private Long saleId;
    private BigDecimal totalAmount;
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

    public Long getId() {
        return id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public LocalDateTime getInvoiceDate() {
        return invoiceDate;
    }

    public Long getSaleId() {
        return saleId;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public SaleResponse getSale() {
        return sale;
    }
}
