import { Product } from './product.model';

export interface TopProduct {
    productId: string;
    productName: string;
    quantitySold: number;
}

export interface DashboardSummary {
    totalStockValue: number;
    totalSalesCount: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    topSellingProducts: TopProduct[];
    lowStockProducts: Product[];
}
