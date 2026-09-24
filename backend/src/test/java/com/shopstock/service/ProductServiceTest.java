package com.shopstock.service;

import com.shopstock.dto.request.ProductRequest;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.*;
import com.shopstock.exception.DuplicateResourceException;
import com.shopstock.exception.ProductInUseException;
import com.shopstock.exception.ResourceNotFoundException;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.SaleItemRepository;
import com.shopstock.repository.StockOperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private StockOperationRepository stockOperationRepository;
    @Mock
    private SaleItemRepository saleItemRepository;
    @Mock
    private CategoryService categoryService;
    @Mock
    private AuthorizationService authorizationService;

    private ProductService productService;
    private final UUID actorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, stockOperationRepository, saleItemRepository,
                categoryService, authorizationService);
    }

    private User adminUser() {
        User user = new User();
        user.setId(actorId);
        user.setRole(Role.ADMIN);
        return user;
    }

    private ProductRequest request(String name, String reference, BigDecimal purchasePrice, BigDecimal sellingPrice,
                                    int quantity, int alertThreshold) {
        return new ProductRequest(name, reference, null, purchasePrice, sellingPrice, quantity, alertThreshold, actorId);
    }

    // --- create ---

    @Test
    void create_savesProductAndLogsRegistrationStockOp_whenReferenceIsUnique() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findByReference("REF-1")).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        ProductResponse response = productService.create(
                request("Water", "REF-1", new BigDecimal("100"), new BigDecimal("150"), 20, 5));

        assertThat(response.name()).isEqualTo("Water");

        ArgumentCaptor<StockOperation> captor = ArgumentCaptor.forClass(StockOperation.class);
        verify(stockOperationRepository).save(captor.capture());
        assertThat(captor.getValue().getOperationType()).isEqualTo(OperationType.REGISTRATION);
        assertThat(captor.getValue().getQuantityChange()).isEqualTo(20f);
    }

    @Test
    void create_throwsDuplicate_whenReferenceAlreadyExists() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findByReference("REF-1")).thenReturn(Optional.of(new Product()));

        assertThatThrownBy(() -> productService.create(
                request("Water", "REF-1", new BigDecimal("100"), new BigDecimal("150"), 20, 5)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("REF-1");
        verify(productRepository, never()).save(any());
        verifyNoInteractions(stockOperationRepository);
    }

    @Test
    void create_propagatesForbidden_whenActorRoleNotAllowed() {
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN))
                .thenThrow(new com.shopstock.exception.ForbiddenException("nope"));

        assertThatThrownBy(() -> productService.create(
                request("Water", "REF-1", new BigDecimal("100"), new BigDecimal("150"), 20, 5)))
                .isInstanceOf(com.shopstock.exception.ForbiddenException.class);
        verifyNoInteractions(productRepository);
    }

    // --- update ---

    private Product existingProduct(UUID id, int quantity, BigDecimal purchasePrice, BigDecimal sellingPrice) {
        Product product = new Product();
        product.setId(id);
        product.setName("Water");
        product.setReference("REF-1");
        product.setQuantityInStock(quantity);
        product.setPurchasePrice(purchasePrice);
        product.setSellingPrice(sellingPrice);
        product.setAlertThreshold(5);
        return product;
    }

    @Test
    void update_throwsNotFound_whenProductMissing() {
        UUID missingId = UUID.randomUUID();
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.update(missingId,
                request("Water", "REF-1", new BigDecimal("100"), new BigDecimal("150"), 20, 5)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_logsNoStockOp_whenNothingChanged() {
        UUID id = UUID.randomUUID();
        Product existing = existingProduct(id, 20, new BigDecimal("100"), new BigDecimal("150"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        productService.update(id, request("Water", "REF-1", new BigDecimal("100"), new BigDecimal("150"), 20, 5));

        verifyNoInteractions(stockOperationRepository);
    }

    @Test
    void update_logsOneStockOp_whenOnlyQuantityChanges() {
        UUID id = UUID.randomUUID();
        Product existing = existingProduct(id, 20, new BigDecimal("100"), new BigDecimal("150"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        productService.update(id, request("Water", "REF-1", new BigDecimal("100"), new BigDecimal("150"), 30, 5));

        ArgumentCaptor<StockOperation> captor = ArgumentCaptor.forClass(StockOperation.class);
        verify(stockOperationRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getQuantityChange()).isEqualTo(10f);
    }

    @Test
    void update_logsThreeStockOps_whenQuantityAndBothPricesChange() {
        UUID id = UUID.randomUUID();
        Product existing = existingProduct(id, 20, new BigDecimal("100"), new BigDecimal("150"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        productService.update(id, request("Water", "REF-1", new BigDecimal("110"), new BigDecimal("160"), 30, 5));

        verify(stockOperationRepository, times(3)).save(any(StockOperation.class));
    }

    @Test
    void update_doesNotRecheckReferenceUniqueness_documentedGap() {
        // Current behavior: unlike create(), update() never calls findByReference,
        // so changing a product's reference to collide with another product's
        // reference silently succeeds. This test pins down that gap, not a fix.
        UUID id = UUID.randomUUID();
        Product existing = existingProduct(id, 20, new BigDecimal("100"), new BigDecimal("150"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductResponse response = productService.update(id,
                request("Water", "SOMEONE-ELSES-REF", new BigDecimal("100"), new BigDecimal("150"), 20, 5));

        assertThat(response.reference()).isEqualTo("SOMEONE-ELSES-REF");
        verify(productRepository, never()).findByReference(any());
    }

    // --- delete ---

    @Test
    void delete_throwsNotFound_whenProductMissing() {
        UUID missingId = UUID.randomUUID();
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.delete(missingId, actorId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_throwsProductInUse_whenStockOperationHistoryExists() {
        UUID id = UUID.randomUUID();
        Product product = existingProduct(id, 20, new BigDecimal("100"), new BigDecimal("150"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(stockOperationRepository.existsByProductId(id)).thenReturn(true);

        assertThatThrownBy(() -> productService.delete(id, actorId))
                .isInstanceOf(ProductInUseException.class)
                .hasMessageContaining("audit trail");
        verify(productRepository, never()).delete(any());
    }

    @Test
    void delete_throwsProductInUse_whenSaleItemHistoryExists() {
        UUID id = UUID.randomUUID();
        Product product = existingProduct(id, 20, new BigDecimal("100"), new BigDecimal("150"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(stockOperationRepository.existsByProductId(id)).thenReturn(false);
        when(saleItemRepository.existsByProductId(id)).thenReturn(true);

        assertThatThrownBy(() -> productService.delete(id, actorId))
                .isInstanceOf(ProductInUseException.class);
        verify(productRepository, never()).delete(any());
    }

    @Test
    void delete_succeeds_whenProductHasNoHistory() {
        UUID id = UUID.randomUUID();
        Product product = existingProduct(id, 20, new BigDecimal("100"), new BigDecimal("150"));
        when(authorizationService.requireRole(actorId, Role.SUPER_ADMIN, Role.ADMIN)).thenReturn(adminUser());
        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(stockOperationRepository.existsByProductId(id)).thenReturn(false);
        when(saleItemRepository.existsByProductId(id)).thenReturn(false);

        productService.delete(id, actorId);

        verify(productRepository).delete(product);
    }

    // --- findNextRef ---

    @Test
    void findNextRef_returns001_whenNoExistingReferencesWithPrefix() {
        when(productRepository.findByRefPrefix("BEV")).thenReturn(List.of());

        assertThat(productService.findNextRef("BEV")).isEqualTo("BEV-001");
    }

    @Test
    void findNextRef_incrementsNumericSuffix_ofLexicographicallyLastMatch() {
        Product p1 = new Product();
        p1.setReference("BEV-001");
        Product p2 = new Product();
        p2.setReference("BEV-002");
        when(productRepository.findByRefPrefix("BEV")).thenReturn(new java.util.ArrayList<>(List.of(p1, p2)));

        assertThat(productService.findNextRef("BEV")).isEqualTo("BEV-003");
    }

    @Test
    void findNextRef_lexicographicVsNumericDivergence_documentedBehavior() {
        // References are normally zero-padded to 3 digits by this same method, so
        // lexicographic and numeric ordering agree in normal use. But if a product
        // was inserted directly with a non-padded reference (e.g. "BEV-9"), sorting
        // by String (not by parsed number) picks "BEV-9" as the "last" one instead
        // of a numerically-larger "BEV-10", because '9' > '1' lexicographically.
        Product nine = new Product();
        nine.setReference("BEV-9");
        Product ten = new Product();
        ten.setReference("BEV-10");
        when(productRepository.findByRefPrefix("BEV")).thenReturn(new java.util.ArrayList<>(List.of(ten, nine)));

        // Lexicographic max of {"BEV-10", "BEV-9"} is "BEV-9" -> suffix 9 + 1 = 10.
        assertThat(productService.findNextRef("BEV")).isEqualTo("BEV-010");
    }

    // --- search ---

    @Test
    void search_filtersByCategoryOnly() {
        UUID categoryId = UUID.randomUUID();
        Product inCategory = new Product();
        inCategory.setName("Water");
        inCategory.setReference("BEV-1");
        when(productRepository.findByCategoryId(categoryId)).thenReturn(List.of(inCategory));

        List<ProductResponse> results = productService.search(null, categoryId);

        assertThat(results).hasSize(1);
        verify(productRepository, never()).findAll();
    }

    @Test
    void search_filtersByQuery_matchingNameOrReference_caseInsensitive() {
        Product water = new Product();
        water.setName("Sparkling Water");
        water.setReference("BEV-1");
        Product chips = new Product();
        chips.setName("Potato Chips");
        chips.setReference("SNK-1");
        when(productRepository.findAll()).thenReturn(List.of(water, chips));

        List<ProductResponse> results = productService.search("water", null);

        assertThat(results).extracting(ProductResponse::name).containsExactly("Sparkling Water");
    }

    @Test
    void search_blankQuery_returnsAllInScope() {
        Product water = new Product();
        water.setName("Water");
        water.setReference("BEV-1");
        Product chips = new Product();
        chips.setName("Chips");
        chips.setReference("SNK-1");
        when(productRepository.findAll()).thenReturn(List.of(water, chips));

        assertThat(productService.search("  ", null)).hasSize(2);
    }

    // --- checkRefAvailability ---

    @Test
    void checkRefAvailability_returnsTrue_whenReferenceNotInUse() {
        when(productRepository.existsByReference("BEV-999")).thenReturn(false);

        assertThat(productService.checkRefAvailability("BEV-999")).isTrue();
    }

    @Test
    void checkRefAvailability_returnsFalse_whenReferenceAlreadyInUse() {
        when(productRepository.existsByReference("BEV-001")).thenReturn(true);

        assertThat(productService.checkRefAvailability("BEV-001")).isFalse();
    }
}
