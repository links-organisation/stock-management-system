package com.shopstock.service;

import com.shopstock.dto.response.DashboardSummaryResponse;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.Product;
import com.shopstock.entity.Sale;
import com.shopstock.entity.SaleItem;
import com.shopstock.entity.User;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.SaleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private SaleRepository saleRepository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(productRepository, saleRepository);
    }

    private Product product(String name, BigDecimal purchasePrice, int quantity, int alertThreshold) {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setName(name);
        p.setPurchasePrice(purchasePrice);
        p.setQuantityInStock(quantity);
        p.setAlertThreshold(alertThreshold);
        return p;
    }

    private Sale saleAt(LocalDateTime dateTime, BigDecimal amount) {
        Sale sale = new Sale();
        sale.setSaleDate(dateTime);
        sale.setTotalAmount(amount);
        return sale;
    }

    @Test
    void getSummary_sumsStockValue_acrossAllProducts() {
        Product a = product("A", new BigDecimal("10"), 5, 1);
        Product b = product("B", new BigDecimal("20"), 3, 1);
        when(productRepository.findAll()).thenReturn(List.of(a, b));
        when(saleRepository.findAll()).thenReturn(List.of());

        DashboardSummaryResponse summary = dashboardService.getSummary();

        // 10*5 + 20*3 = 110
        assertThat(summary.totalStockValue()).isEqualByComparingTo("110");
    }

    @Test
    void getSummary_revenueToday_excludesYesterdayLastMoment_includesTodayFirstMoment() {
        LocalDate today = LocalDate.now();
        Sale yesterday = saleAt(today.minusDays(1).atTime(23, 59, 59), new BigDecimal("999"));
        Sale todayEarly = saleAt(today.atStartOfDay().plusSeconds(1), new BigDecimal("50"));
        when(productRepository.findAll()).thenReturn(List.of());
        when(saleRepository.findAll()).thenReturn(List.of(yesterday, todayEarly));

        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.revenueToday()).isEqualByComparingTo("50");
    }

    @Test
    void getSummary_revenueThisWeek_excludesLastSunday_includesThisMonday() {
        LocalDate mondayThisWeek = LocalDate.now().with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        Sale lastSunday = saleAt(mondayThisWeek.minusDays(1).atTime(12, 0), new BigDecimal("999"));
        Sale thisMonday = saleAt(mondayThisWeek.atStartOfDay(), new BigDecimal("75"));
        when(productRepository.findAll()).thenReturn(List.of());
        when(saleRepository.findAll()).thenReturn(List.of(lastSunday, thisMonday));

        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.revenueThisWeek()).isEqualByComparingTo("75");
    }

    @Test
    void getSummary_revenueThisMonth_excludesLastDayOfPreviousMonth_includesFirstOfThisMonth() {
        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
        Sale lastMonthEnd = saleAt(firstOfMonth.minusDays(1).atTime(23, 59), new BigDecimal("999"));
        Sale firstOfThisMonth = saleAt(firstOfMonth.atStartOfDay(), new BigDecimal("42"));
        when(productRepository.findAll()).thenReturn(List.of());
        when(saleRepository.findAll()).thenReturn(List.of(lastMonthEnd, firstOfThisMonth));

        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.revenueThisMonth()).isEqualByComparingTo("42");
    }

    @Test
    void getSummary_topSellingProducts_rankedByTotalQuantitySold() {
        Product popular = product("Popular", BigDecimal.ONE, 100, 1);
        Product rare = product("Rare", BigDecimal.ONE, 100, 1);
        when(productRepository.findAll()).thenReturn(List.of(popular, rare));
        when(productRepository.findById(popular.getId())).thenReturn(java.util.Optional.of(popular));
        when(productRepository.findById(rare.getId())).thenReturn(java.util.Optional.of(rare));

        Sale sale = new Sale();
        sale.setSaleDate(LocalDateTime.now());
        sale.setTotalAmount(BigDecimal.TEN);
        SaleItem popularItem = new SaleItem();
        popularItem.setProduct(popular);
        popularItem.setQuantity(9);
        SaleItem rareItem = new SaleItem();
        rareItem.setProduct(rare);
        rareItem.setQuantity(1);
        sale.setItems(List.of(popularItem, rareItem));
        when(saleRepository.findAll()).thenReturn(List.of(sale));

        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.topSellingProducts()).hasSize(2);
        assertThat(summary.topSellingProducts().get(0).productName()).isEqualTo("Popular");
        assertThat(summary.topSellingProducts().get(0).quantitySold()).isEqualTo(9);
    }

    @Test
    void getSummary_lowStock_strictlyLessThanThreshold_sortedAscending() {
        Product exactlyAtThreshold = product("AtThreshold", BigDecimal.ONE, 5, 5);
        Product belowThreshold = product("Below", BigDecimal.ONE, 2, 5);
        Product wellBelow = product("WellBelow", BigDecimal.ONE, 1, 5);
        when(productRepository.findAll()).thenReturn(List.of(exactlyAtThreshold, belowThreshold, wellBelow));
        when(saleRepository.findAll()).thenReturn(List.of());

        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.lowStockProducts()).extracting(ProductResponse::name).containsExactly("WellBelow", "Below");
    }
}
