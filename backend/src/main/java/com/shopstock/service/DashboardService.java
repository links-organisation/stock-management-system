package com.shopstock.service;

import com.shopstock.dto.response.DashboardSummaryResponse;
import com.shopstock.dto.response.ProductResponse;
import com.shopstock.entity.Product;
import com.shopstock.entity.Sale;
import com.shopstock.entity.SaleItem;
import com.shopstock.repository.ProductRepository;
import com.shopstock.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;

    public DashboardService(ProductRepository productRepository, SaleRepository saleRepository) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        List<Product> products = productRepository.findAll();
        List<Sale> sales = saleRepository.findAll();
        Map<UUID, Product> productMap = products.stream()
                .filter(p -> p.getId() != null)
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

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
                .filter(item -> item.getProduct() != null && item.getProduct().getId() != null)
                .collect(Collectors.groupingBy(item -> item.getProduct().getId(), Collectors.summingLong(SaleItem::getQuantity)))
                .entrySet().stream()
                .sorted(Map.Entry.<UUID, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Product product = productMap.getOrDefault(e.getKey(), productRepository.findById(e.getKey()).orElse(null));
                    if (product == null) {
                        return new DashboardSummaryResponse.TopProduct(e.getKey(), "Unknown", BigDecimal.ZERO, e.getValue());
                    }
                    return new DashboardSummaryResponse.TopProduct(product.getId(), product.getName(), product.getSellingPrice(), e.getValue());
                })
                .collect(Collectors.toList());

        List<ProductResponse> lowStockProducts = products.stream()
                .filter(p -> p.getQuantityInStock() < p.getAlertThreshold())
                .sorted(Comparator.comparing(Product::getQuantityInStock))
                .map(ProductResponse::new)
                .collect(Collectors.toList());

        // Category distribution calculation
        Map<String, List<Product>> productsByCategoryName = products.stream()
                .collect(Collectors.groupingBy(p -> (p.getCategory() != null && p.getCategory().getName() != null)
                        ? p.getCategory().getName() : "Uncategorized"));

        Map<String, BigDecimal> categorySalesRevenue = new HashMap<>();
        for (Sale sale : sales) {
            for (SaleItem item : sale.getItems()) {
                if (item.getProduct() != null && item.getProduct().getId() != null) {
                    Product fullProduct = productMap.get(item.getProduct().getId());
                    String catName = (fullProduct != null && fullProduct.getCategory() != null && fullProduct.getCategory().getName() != null)
                            ? fullProduct.getCategory().getName() : "Uncategorized";
                    categorySalesRevenue.merge(catName, item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO, BigDecimal::add);
                }
            }
        }

        List<DashboardSummaryResponse.CategoryDistribution> categoryDistribution = productsByCategoryName.entrySet().stream()
                .map(entry -> {
                    String catName = entry.getKey();
                    List<Product> catProducts = entry.getValue();
                    UUID catId = catProducts.isEmpty() || catProducts.get(0).getCategory() == null ? null : catProducts.get(0).getCategory().getId();
                    long count = catProducts.size();
                    BigDecimal stockVal = catProducts.stream()
                            .map(p -> p.getPurchasePrice().multiply(BigDecimal.valueOf(p.getQuantityInStock())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal salesRev = categorySalesRevenue.getOrDefault(catName, BigDecimal.ZERO);
                    return new DashboardSummaryResponse.CategoryDistribution(catId, catName, count, stockVal, salesRev);
                })
                .sorted(Comparator.comparing(DashboardSummaryResponse.CategoryDistribution::stockValue).reversed())
                .collect(Collectors.toList());

        // Sales timeline (Last 7 days)
        LocalDate today = LocalDate.now();
        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
        List<DashboardSummaryResponse.SalesTimelinePoint> salesTimeline = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            List<Sale> daySales = sales.stream()
                    .filter(s -> s.getSaleDate() != null && s.getSaleDate().toLocalDate().isEqual(date))
                    .toList();
            BigDecimal dayRevenue = daySales.stream()
                    .map(Sale::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long dayCount = daySales.size();
            String label = date.format(labelFormatter);
            salesTimeline.add(new DashboardSummaryResponse.SalesTimelinePoint(date.toString(), label, dayRevenue, dayCount));
        }

        // Product profitability (Benefits)
        Map<UUID, List<SaleItem>> itemsByProduct = sales.stream()
                .flatMap(s -> s.getItems().stream())
                .filter(item -> item.getProduct() != null && item.getProduct().getId() != null)
                .collect(Collectors.groupingBy(item -> item.getProduct().getId()));

        List<DashboardSummaryResponse.ProductProfit> productProfits = itemsByProduct.entrySet().stream()
                .map(entry -> {
                    UUID pId = entry.getKey();
                    List<SaleItem> items = entry.getValue();
                    Product p = productMap.get(pId);
                    String pName = p != null ? p.getName() : "Unknown";
                    BigDecimal purchasePrice = p != null ? p.getPurchasePrice() : BigDecimal.ZERO;

                    BigDecimal totalRevenue = items.stream()
                            .map(SaleItem::getSubtotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalCost = items.stream()
                            .map(item -> purchasePrice.multiply(BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 0)))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalProfit = totalRevenue.subtract(totalCost);
                    double margin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                            ? totalProfit.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP).doubleValue()
                            : 0.0;

                    return new DashboardSummaryResponse.ProductProfit(pId, pName, totalRevenue, totalCost, totalProfit, margin);
                })
                .sorted(Comparator.comparing(DashboardSummaryResponse.ProductProfit::totalProfit).reversed())
                .limit(5)
                .collect(Collectors.toList());

        // Stock Health
        long outOfStock = products.stream().filter(p -> p.getQuantityInStock() <= 0).count();
        long lowStock = products.stream().filter(p -> p.getQuantityInStock() > 0 && p.getQuantityInStock() < p.getAlertThreshold()).count();
        long inStock = products.stream().filter(p -> p.getQuantityInStock() >= p.getAlertThreshold()).count();
        DashboardSummaryResponse.StockHealth stockHealth = new DashboardSummaryResponse.StockHealth(
                inStock, lowStock, outOfStock, products.size()
        );

        return new DashboardSummaryResponse(
                totalStockValue,
                sales.size(),
                revenueToday,
                revenueThisWeek,
                revenueThisMonth,
                topSellingProducts,
                lowStockProducts,
                categoryDistribution,
                salesTimeline,
                productProfits,
                stockHealth
        );
    }

    private BigDecimal revenueSince(List<Sale> sales, LocalDateTime start, LocalDateTime end) {
        return sales.stream()
                .filter(s -> s.getSaleDate() != null && !s.getSaleDate().isBefore(start) && !s.getSaleDate().isAfter(end))
                .map(Sale::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
