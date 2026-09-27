package com.shopstock.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record DashboardSummaryResponse(
        BigDecimal totalStockValue,
        long totalSalesCount,
        BigDecimal revenueToday,
        BigDecimal revenueThisWeek,
        BigDecimal revenueThisMonth,
        List<TopProduct> topSellingProducts,
        List<ProductResponse> lowStockProducts,
        List<CategoryDistribution> categoryDistribution,
        List<SalesTimelinePoint> salesTimeline,
        List<ProductProfit> productProfits,
        StockHealth stockHealth
) {
    public record TopProduct(UUID productId, String productName, BigDecimal productUnitPrice, long quantitySold) { }

    public record CategoryDistribution(UUID categoryId, String categoryName, long productCount, BigDecimal stockValue, BigDecimal salesRevenue) { }

    public record SalesTimelinePoint(String date, String label, BigDecimal revenue, long orderCount) { }

    public record ProductProfit(UUID productId, String productName, BigDecimal totalRevenue, BigDecimal totalCost, BigDecimal totalProfit, double profitMarginPercentage) { }

    public record StockHealth(long inStockCount, long lowStockCount, long outOfStockCount, long totalProducts) { }
}
