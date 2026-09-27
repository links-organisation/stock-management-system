import { Product } from './product.model';

export interface TopProduct {
    productId: string;
    productName: string;
    productUnitPrice: number;
    quantitySold: number;
}

export interface CategoryDistribution {
    categoryId: string | null;
    categoryName: string;
    productCount: number;
    stockValue: number;
    salesRevenue: number;
}

export interface SalesTimelinePoint {
    date: string;
    label: string;
    revenue: number;
    orderCount: number;
}

export interface ProductProfit {
    productId: string;
    productName: string;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMarginPercentage: number;
}

export interface StockHealth {
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalProducts: number;
}

export interface DashboardSummary {
    totalStockValue: number;
    totalSalesCount: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    topSellingProducts: TopProduct[];
    lowStockProducts: Product[];
    categoryDistribution?: CategoryDistribution[];
    salesTimeline?: SalesTimelinePoint[];
    productProfits?: ProductProfit[];
    stockHealth?: StockHealth;
}
