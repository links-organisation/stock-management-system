package com.shopstock.service;

import com.shopstock.dto.response.StockOperationResponse;
import com.shopstock.entity.OperationType;
import com.shopstock.entity.Product;
import com.shopstock.entity.StockOperation;
import com.shopstock.entity.User;
import com.shopstock.repository.StockOperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockOperationServiceTest {

    @Mock
    private StockOperationRepository stockOperationRepository;

    private StockOperationService stockOperationService;

    private final UUID productAId = UUID.randomUUID();
    private final UUID productBId = UUID.randomUUID();
    private final UUID userAId = UUID.randomUUID();
    private final UUID userBId = UUID.randomUUID();

    private StockOperation operation(UUID productId, OperationType type, UUID performedById, LocalDate date) {
        Product product = new Product();
        product.setId(productId);
        product.setName("Product");
        User user = new User();
        user.setId(performedById);
        user.setUsername("user");
        user.setFullName("User");

        StockOperation op = new StockOperation();
        op.setProduct(product);
        op.setOperationType(type);
        op.setPerformedBy(user);
        op.setQuantityChange(1f);
        op.setOperationDate(date.atTime(12, 0));
        return op;
    }

    @BeforeEach
    void setUp() {
        stockOperationService = new StockOperationService(stockOperationRepository);
    }

    @Test
    void findAll_noFilters_returnsEverything() {
        LocalDate today = LocalDate.now();
        StockOperation op1 = operation(productAId, OperationType.REGISTRATION, userAId, today);
        StockOperation op2 = operation(productBId, OperationType.SALE, userBId, today);
        when(stockOperationRepository.findAllByOrderByOperationDateDesc()).thenReturn(List.of(op1, op2));

        List<StockOperationResponse> results = stockOperationService.findAll(null, null, null, null, null);

        assertThat(results).hasSize(2);
    }

    @Test
    void findAll_filtersByProductId() {
        LocalDate today = LocalDate.now();
        StockOperation op1 = operation(productAId, OperationType.REGISTRATION, userAId, today);
        StockOperation op2 = operation(productBId, OperationType.SALE, userBId, today);
        when(stockOperationRepository.findAllByOrderByOperationDateDesc()).thenReturn(List.of(op1, op2));

        List<StockOperationResponse> results = stockOperationService.findAll(productAId, null, null, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).productId()).isEqualTo(productAId);
    }

    @Test
    void findAll_filtersByOperationType() {
        LocalDate today = LocalDate.now();
        StockOperation op1 = operation(productAId, OperationType.REGISTRATION, userAId, today);
        StockOperation op2 = operation(productBId, OperationType.SALE, userBId, today);
        when(stockOperationRepository.findAllByOrderByOperationDateDesc()).thenReturn(List.of(op1, op2));

        List<StockOperationResponse> results = stockOperationService.findAll(null, OperationType.SALE, null, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).operationType()).isEqualTo(OperationType.SALE);
    }

    @Test
    void findAll_filtersByPerformedByUserId() {
        LocalDate today = LocalDate.now();
        StockOperation op1 = operation(productAId, OperationType.REGISTRATION, userAId, today);
        StockOperation op2 = operation(productBId, OperationType.SALE, userBId, today);
        when(stockOperationRepository.findAllByOrderByOperationDateDesc()).thenReturn(List.of(op1, op2));

        List<StockOperationResponse> results = stockOperationService.findAll(null, null, userBId, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).performedByUserId()).isEqualTo(userBId);
    }

    @Test
    void findAll_dateRange_isInclusiveOnBothEnds() {
        LocalDate from = LocalDate.of(2026, 1, 10);
        LocalDate to = LocalDate.of(2026, 1, 20);
        StockOperation beforeRange = operation(productAId, OperationType.REGISTRATION, userAId, from.minusDays(1));
        StockOperation onFrom = operation(productAId, OperationType.REGISTRATION, userAId, from);
        StockOperation onTo = operation(productAId, OperationType.REGISTRATION, userAId, to);
        StockOperation afterRange = operation(productAId, OperationType.REGISTRATION, userAId, to.plusDays(1));
        when(stockOperationRepository.findAllByOrderByOperationDateDesc())
                .thenReturn(List.of(beforeRange, onFrom, onTo, afterRange));

        List<StockOperationResponse> results = stockOperationService.findAll(null, null, null, from, to);

        assertThat(results).hasSize(2);
    }
}
