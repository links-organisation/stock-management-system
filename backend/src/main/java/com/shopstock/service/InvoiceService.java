package com.shopstock.service;

import com.shopstock.dto.response.InvoiceResponse;
import com.shopstock.entity.Invoice;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public List<InvoiceResponse> findAll() {
        return invoiceRepository.findAll().stream()
                .map(InvoiceResponse::new)
                .collect(Collectors.toList());
    }

    public InvoiceResponse findById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id " + id));
        return new InvoiceResponse(invoice, true);
    }
}
