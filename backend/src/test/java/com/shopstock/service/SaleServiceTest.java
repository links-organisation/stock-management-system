package com.shopstock.service;

import com.shopstock.dto.request.SaleItemRequest;
import com.shopstock.dto.request.SaleRequest;
import com.shopstock.dto.response.SaleResponse;
import com.shopstock.entity.*;
import com.shopstock.exception.ForbiddenException;
import com.shopstock.exception.InsufficientStockException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.InvoiceRepository;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.SaleRepository;
import com.shopstock.repository.StockOperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private StockOperationRepository stockOperationRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private AuthorizationService authorizationService;

    private SaleService saleService;
    private final UUID actorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        saleService = new SaleService(saleRepository, productRepository, stockOperationRepository,
                invoiceRepository, authorizationService);
    }

    private Product productWithStock(UUID id, int quantity, BigDecimal price) {
        Product product = new Product();
        product.setId(id);
        product.setName("Water");
        product.setSellingPrice(price);
        product.setQuantityInStock(quantity);
        return product;
    }

    private User actor(Role role) {
        User user = new User();
        user.setId(actorId);
        user.setRole(role);
        return user;
    }

    @Test
    void createSale_throwsForbidden_forComptaActor() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER))
                .thenThrow(new ForbiddenException("nope"));

        assertThatThrownBy(() -> saleService.createSale(
                new SaleRequest(actorId, null, List.of(new SaleItemRequest(UUID.randomUUID(), 1)))))
                .isInstanceOf(ForbiddenException.class);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"SUPER_ADMIN", "ADMIN", "SELLER"})
    void createSale_succeeds_forAllowedRoles(Role role) {
        UUID productId = UUID.randomUUID();
        Product product = productWithStock(productId, 10, new BigDecimal("100.00"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER))
                .thenReturn(actor(role));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> {
            Sale s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(invoiceRepository.countByInvoiceNumberStartingWith(any())).thenReturn(0L);

        SaleResponse response = saleService.createSale(
                new SaleRequest(actorId, "Walk-in", List.of(new SaleItemRequest(productId, 2))));

        assertThat(response.totalAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    void createSale_throwsNotFound_whenProductMissing() {
        UUID missingProductId = UUID.randomUUID();
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER))
                .thenReturn(actor(Role.SELLER));
        when(productRepository.findById(missingProductId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> saleService.createSale(
                new SaleRequest(actorId, null, List.of(new SaleItemRequest(missingProductId, 1)))))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createSale_throwsInsufficientStock_whenRequestedExceedsAvailable() {
        UUID productId = UUID.randomUUID();
        Product product = productWithStock(productId, 5, new BigDecimal("100.00"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER))
                .thenReturn(actor(Role.SELLER));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> saleService.createSale(
                new SaleRequest(actorId, null, List.of(new SaleItemRequest(productId, 10)))))
                .isInstanceOf(InsufficientStockException.class);
    }

    @Test
    void createSale_decrementsStockAndLogsOneNegativeStockOpPerItem() {
        UUID productId = UUID.randomUUID();
        Product product = productWithStock(productId, 10, new BigDecimal("100.00"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER))
                .thenReturn(actor(Role.SELLER));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));
        when(invoiceRepository.countByInvoiceNumberStartingWith(any())).thenReturn(0L);

        saleService.createSale(new SaleRequest(actorId, null, List.of(new SaleItemRequest(productId, 3))));

        assertThat(product.getQuantityInStock()).isEqualTo(7);
        ArgumentCaptor<StockOperation> captor = ArgumentCaptor.forClass(StockOperation.class);
        verify(stockOperationRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getOperationType()).isEqualTo(OperationType.SALE);
        assertThat(captor.getValue().getQuantityChange()).isEqualTo(-3f);
    }

    @Test
    void createSale_createsLinkedInvoice_withGeneratedNumber() {
        UUID productId = UUID.randomUUID();
        Product product = productWithStock(productId, 10, new BigDecimal("100.00"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER))
                .thenReturn(actor(Role.SELLER));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));
        when(invoiceRepository.countByInvoiceNumberStartingWith(any())).thenReturn(4L);

        saleService.createSale(new SaleRequest(actorId, null, List.of(new SaleItemRequest(productId, 1))));

        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(captor.capture());
        assertThat(captor.getValue().getInvoiceNumber())
                .matches("INV-\\d{4}-000005");
    }
}
