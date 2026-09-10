package com.shopstock.dto.response;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryResponse {

    private BigDecimal totalStockValue;
    private long totalSalesCount;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisWeek;
    private BigDecimal revenueThisMonth;
    private List<TopProduct> topSellingProducts;
    private List<ProductResponse> lowStockProducts;

    public DashboardSummaryResponse(BigDecimal totalStockValue, long totalSalesCount,
                                     BigDecimal revenueToday, BigDecimal revenueThisWeek, BigDecimal revenueThisMonth,
                                     List<TopProduct> topSellingProducts, List<ProductResponse> lowStockProducts) {
        this.totalStockValue = totalStockValue;
        this.totalSalesCount = totalSalesCount;
        this.revenueToday = revenueToday;
        this.revenueThisWeek = revenueThisWeek;
        this.revenueThisMonth = revenueThisMonth;
        this.topSellingProducts = topSellingProducts;
        this.lowStockProducts = lowStockProducts;
    }

    public BigDecimal getTotalStockValue() {
        return totalStockValue;
    }

    public long getTotalSalesCount() {
        return totalSalesCount;
    }

    public BigDecimal getRevenueToday() {
        return revenueToday;
    }

    public BigDecimal getRevenueThisWeek() {
        return revenueThisWeek;
    }

    public BigDecimal getRevenueThisMonth() {
        return revenueThisMonth;
    }

    public List<TopProduct> getTopSellingProducts() {
        return topSellingProducts;
    }

    public List<ProductResponse> getLowStockProducts() {
        return lowStockProducts;
    }

    public static class TopProduct {
        private Long productId;
        private String productName;
        private long quantitySold;

        public TopProduct(Long productId, String productName, long quantitySold) {
            this.productId = productId;
            this.productName = productName;
            this.quantitySold = quantitySold;
        }

        public Long getProductId() {
            return productId;
        }

        public String getProductName() {
            return productName;
        }

        public long getQuantitySold() {
            return quantitySold;
        }
    }
}
