package com.shopstock.service;

import com.shopstock.dto.request.AdjustmentRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.OperationType;
import com.shopstock.entity.Product;
import com.shopstock.entity.Role;
import com.shopstock.entity.StockOperation;
import com.shopstock.entity.User;
import com.shopstock.exception.ForbiddenException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.StockOperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private StockOperationRepository stockOperationRepository;
    @Mock
    private AuthorizationService authorizationService;

    private InventoryService inventoryService;
    private final UUID actorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(productRepository, stockOperationRepository, authorizationService);
    }

    private User adminUser() {
        User user = new User();
        user.setId(actorId);
        user.setRole(Role.ADMIN);
        return user;
    }

    private Product product(UUID id, int quantity) {
        Product product = new Product();
        product.setId(id);
        product.setQuantityInStock(quantity);
        return product;
    }

    @Test
    void adjust_throwsForbidden_whenActorRoleNotAllowed() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN))
                .thenThrow(new ForbiddenException("nope"));

        assertThatThrownBy(() -> inventoryService.adjust(new AdjustmentRequest(UUID.randomUUID(), 10, null, actorId)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void adjust_throwsNotFound_whenProductMissing() {
        UUID missingId = UUID.randomUUID();
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.adjust(new AdjustmentRequest(missingId, 10, null, actorId)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void adjust_setsExactNewQuantity_andLogsStockOp_whenDeltaNonZero() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, 10);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        ProductResponse response = inventoryService.adjust(new AdjustmentRequest(productId, 25, "recount", actorId));

        assertThat(response.quantityInStock()).isEqualTo(25);
        ArgumentCaptor<StockOperation> captor = ArgumentCaptor.forClass(StockOperation.class);
        verify(stockOperationRepository).save(captor.capture());
        assertThat(captor.getValue().getOperationType()).isEqualTo(OperationType.ADJUSTMENT);
        assertThat(captor.getValue().getQuantityChange()).isEqualTo(15f);
    }

    @Test
    void adjust_logsNoStockOp_whenNewQuantityEqualsCurrent() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, 10);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        inventoryService.adjust(new AdjustmentRequest(productId, 10, null, actorId));

        verifyNoInteractions(stockOperationRepository);
    }

    @Test
    void adjust_defaultsComment_toStockAdjustedByDelta_whenCommentIsNull() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, 10);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        inventoryService.adjust(new AdjustmentRequest(productId, 25, null, actorId));

        ArgumentCaptor<StockOperation> captor = ArgumentCaptor.forClass(StockOperation.class);
        verify(stockOperationRepository).save(captor.capture());
        assertThat(captor.getValue().getComment()).isEqualTo("Stock adjusted by 15");
    }

    @Test
    void adjust_defaultsComment_toStockAdjustedByDelta_whenCommentIsBlank() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, 10);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        inventoryService.adjust(new AdjustmentRequest(productId, 5, "   ", actorId));

        ArgumentCaptor<StockOperation> captor = ArgumentCaptor.forClass(StockOperation.class);
        verify(stockOperationRepository).save(captor.capture());
        assertThat(captor.getValue().getComment()).isEqualTo("Stock adjusted by -5");
    }

    @Test
    void adjust_keepsProvidedComment_whenCommentNonBlank() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, 10);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        inventoryService.adjust(new AdjustmentRequest(productId, 25, "recount", actorId));

        ArgumentCaptor<StockOperation> captor = ArgumentCaptor.forClass(StockOperation.class);
        verify(stockOperationRepository).save(captor.capture());
        assertThat(captor.getValue().getComment()).isEqualTo("recount");
    }

    @Test
    void adjust_acceptsNegativeQuantity_documentedGap_noGuard() {
        // Current behavior: InventoryService.adjust has no guard against a negative
        // newQuantity, unlike other stock-affecting paths. This pins down the gap.
        UUID productId = UUID.randomUUID();
        Product product = product(productId, 10);
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        ProductResponse response = inventoryService.adjust(new AdjustmentRequest(productId, -5, null, actorId));

        assertThat(response.quantityInStock()).isEqualTo(-5);
    }
}
