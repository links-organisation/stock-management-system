package com.shopstock.service;

import com.shopstock.dto.response.InvoiceResponse;
import com.shopstock.entity.Invoice;
import com.shopstock.entity.Sale;
import com.shopstock.entity.User;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    private InvoiceService invoiceService;

    @BeforeEach
    void setUp() {
        invoiceService = new InvoiceService(invoiceRepository);
    }

    @Test
    void findAll_mapsAllInvoices() {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-2026-00001");
        invoice.setTotalAmount(BigDecimal.TEN);
        invoice.setSale(new Sale());
        when(invoiceRepository.findAll()).thenReturn(List.of(invoice));

        List<InvoiceResponse> result = invoiceService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).invoiceNumber()).isEqualTo("INV-2026-00001");
    }

    @Test
    void findById_returnsInvoice_whenExists() {
        UUID id = UUID.randomUUID();
        Sale sale = new Sale();
        sale.setPerformedBy(new User());
        Invoice invoice = new Invoice();
        invoice.setId(id);
        invoice.setInvoiceNumber("INV-2026-00002");
        invoice.setTotalAmount(BigDecimal.TEN);
        invoice.setSale(sale);
        when(invoiceRepository.findById(id)).thenReturn(Optional.of(invoice));

        InvoiceResponse response = invoiceService.findById(id);

        assertThat(response.invoiceNumber()).isEqualTo("INV-2026-00002");
    }

    @Test
    void findById_throwsNotFound_whenMissing() {
        UUID missingId = UUID.randomUUID();
        when(invoiceRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.findById(missingId)).isInstanceOf(ResourceNotFoundException.class);
    }
}
