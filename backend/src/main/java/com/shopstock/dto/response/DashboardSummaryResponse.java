package com.shopstock.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record DashboardSummaryResponse(
        BigDecimal totalStockValue, long totalSalesCount, BigDecimal revenueToday,
        BigDecimal revenueThisWeek, BigDecimal revenueThisMonth,
        List<TopProduct> topSellingProducts, List<ProductResponse> lowStockProducts
) {
    public record TopProduct(UUID productId, String productName, long quantitySold) { }
}
