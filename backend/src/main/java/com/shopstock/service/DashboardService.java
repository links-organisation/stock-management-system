package com.shopstock.service;

import com.shopstock.dto.response.DashboardSummaryResponse;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.Product;
import com.shopstock.entity.Sale;
import com.shopstock.entity.SaleItem;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;

    public DashboardService(ProductRepository productRepository, SaleRepository saleRepository) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
    }

    public DashboardSummaryResponse getSummary() {
        List<Product> products = productRepository.findAll();
        List<Sale> sales = saleRepository.findAll();

        BigDecimal totalStockValue = products.stream()
                .map(p -> p.getPurchasePrice().multiply(BigDecimal.valueOf(p.getQuantityInStock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        BigDecimal revenueToday = revenueSince(sales, startOfDay, now);
        BigDecimal revenueThisWeek = revenueSince(sales, startOfWeek, now);
        BigDecimal revenueThisMonth = revenueSince(sales, startOfMonth, now);

        List<DashboardSummaryResponse.TopProduct> topSellingProducts = sales.stream()
                .flatMap(sale -> sale.getItems().stream())
                .collect(Collectors.groupingBy(item -> item.getProduct().getId(), Collectors.summingLong(SaleItem::getQuantity)))
                .entrySet().stream()
                .sorted(Map.Entry.<UUID, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Product product = productRepository.findById(e.getKey()).orElseThrow();
                    return new DashboardSummaryResponse.TopProduct(product.getId(), product.getName(), e.getValue());
                })
                .collect(Collectors.toList());

        List<ProductResponse> lowStockProducts = products.stream()
                .filter(p -> p.getQuantityInStock() < p.getAlertThreshold())
                .sorted(Comparator.comparing(Product::getQuantityInStock))
                .map(ProductResponse::new)
                .collect(Collectors.toList());

        return new DashboardSummaryResponse(
                totalStockValue,
                sales.size(),
                revenueToday,
                revenueThisWeek,
                revenueThisMonth,
                topSellingProducts,
                lowStockProducts
        );
    }

    private BigDecimal revenueSince(List<Sale> sales, LocalDateTime start, LocalDateTime end) {
        return sales.stream()
                .filter(s -> !s.getSaleDate().isBefore(start) && !s.getSaleDate().isAfter(end))
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
