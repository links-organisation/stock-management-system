import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DashboardService } from '@core/services/dashboard/dashboard.service';
import {
    CategoryDistribution,
    DashboardSummary,
    ProductProfit,
    SalesTimelinePoint,
    StockHealth,
    TopProduct,
} from '@core/models/dashboard.model';
import { KpiCard } from '@features/dashboard/kpi-card/kpi-card';
import { FcfaPipe } from '@shared/pipes/fcfa/fcfa-pipe';

export type TopSellingSortColumn = 'productName' | 'quantitySold' | 'totalPrice' | 'productUnitPrice';
export type SortDirection = 'asc' | 'desc';

export interface CategoryDonutSlice extends CategoryDistribution {
    color: string;
    percentage: number;
    strokeDasharray: string;
    strokeDashoffset: number;
}

export interface TimelineBar extends SalesTimelinePoint {
    x: number;
    y: number;
    height: number;
    width: number;
    formattedRevenue: string;
}

const CATEGORY_PALETTE = [
    '#1b4bce',
    '#2f6f5e',
    '#d9a62e',
    '#b5432f',
    '#7c3aed',
    '#0891b2',
    '#ea580c',
    '#4b5563',
];

const DONUT_CIRCUMFERENCE = 2 * Math.PI * 70; // r = 70 -> ~439.82
const HEALTH_RING_CIRCUMFERENCE = 2 * Math.PI * 52; // r = 52 -> ~326.73

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [DecimalPipe, RouterLink, KpiCard, FcfaPipe, TranslocoPipe],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
})
export class Dashboard {
    summary = signal<DashboardSummary | null>(null);
    isLoading = signal(true);
    errorMessage = signal('');

    isSortOpen = signal(false);
    sortColumn = signal<TopSellingSortColumn>('quantitySold');
    sortDirection = signal<SortDirection>('desc');

    tempSortColumn = signal<TopSellingSortColumn>('quantitySold');
    tempSortDirection = signal<SortDirection>('desc');

    hoveredTimelineIndex = signal<number | null>(null);

    private transloco = inject(TranslocoService);

    sortedTopSellingProducts = computed(() => {
        const list = this.summary()?.topSellingProducts;
        if (!list) return [];
        const col = this.sortColumn();
        const isAsc = this.sortDirection() === 'asc';

        return [...list].sort((a, b) => {
            if (col === 'productName') {
                return a.productName.localeCompare(b.productName) * (isAsc ? 1 : -1);
            } else if (col === 'quantitySold') {
                return (a.quantitySold - b.quantitySold) * (isAsc ? 1 : -1);
            } else if (col === 'totalPrice') {
                const totalA = a.productUnitPrice * a.quantitySold;
                const totalB = b.productUnitPrice * b.quantitySold;
                return (totalA - totalB) * (isAsc ? 1 : -1);
            } else if (col === 'productUnitPrice') {
                return (a.productUnitPrice - b.productUnitPrice) * (isAsc ? 1 : -1);
            }
            return 0;
        });
    });

    // 1. Sales Velocity & Revenue Timeline
    timelineBars = computed<TimelineBar[]>(() => {
        const points = this.summary()?.salesTimeline || [];
        if (points.length === 0) return [];

        const maxRevenue = Math.max(...points.map((p) => p.revenue), 1);
        const chartHeight = 110;
        const baselineY = 140;
        const barWidth = 32;
        const totalPoints = points.length;
        const availableWidth = 390;
        const spacing = totalPoints > 1 ? availableWidth / (totalPoints - 1) : 0;
        const startX = 55;

        return points.map((p, index) => {
            const height = p.revenue > 0 ? Math.max(4, Math.round((p.revenue / maxRevenue) * chartHeight)) : 0;
            const x = Math.round(startX + index * spacing - barWidth / 2);
            const y = baselineY - height;
            return {
                ...p,
                x,
                y,
                height,
                width: barWidth,
                formattedRevenue: new Intl.NumberFormat('fr-FR').format(p.revenue),
            };
        });
    });

    timelineMaxRevenue = computed(() => {
        const points = this.summary()?.salesTimeline || [];
        return Math.max(...points.map((p) => p.revenue), 0);
    });

    timelineTotalRevenue = computed(() => {
        const points = this.summary()?.salesTimeline || [];
        return points.reduce((acc, curr) => acc + curr.revenue, 0);
    });

    timelineTotalOrders = computed(() => {
        const points = this.summary()?.salesTimeline || [];
        return points.reduce((acc, curr) => acc + curr.orderCount, 0);
    });

    // 2. Category Distribution Donut Slices
    donutSlices = computed<CategoryDonutSlice[]>(() => {
        const categories = this.summary()?.categoryDistribution || [];
        const totalValue = categories.reduce((acc, c) => acc + c.stockValue, 0);
        if (totalValue === 0) return [];

        let currentOffset = 0;
        return categories.map((cat, index) => {
            const fraction = cat.stockValue / totalValue;
            const percentage = Math.round(fraction * 1000) / 10;
            const dashLength = fraction * DONUT_CIRCUMFERENCE;
            const strokeDasharray = `${dashLength.toFixed(2)} ${(DONUT_CIRCUMFERENCE - dashLength).toFixed(2)}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += dashLength;
            const color = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

            return {
                ...cat,
                color,
                percentage,
                strokeDasharray,
                strokeDashoffset,
            };
        });
    });

    donutCircumference = DONUT_CIRCUMFERENCE;

    // 3. Product Profitability & Margins
    productProfits = computed<ProductProfit[]>(() => {
        return this.summary()?.productProfits || [];
    });

    maxProfitRevenue = computed(() => {
        const profits = this.productProfits();
        return Math.max(...profits.map((p) => p.totalRevenue), 1);
    });

    // 4. Stock Health Breakdown & Ring
    stockHealth = computed(() => {
        const health = this.summary()?.stockHealth;
        if (!health || health.totalProducts === 0) {
            return {
                inStockCount: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
                totalProducts: 0,
                inStockPercent: 0,
                lowStockPercent: 0,
                outOfStockPercent: 0,
                inStockDash: `0 ${HEALTH_RING_CIRCUMFERENCE}`,
                lowStockDash: `0 ${HEALTH_RING_CIRCUMFERENCE}`,
                outOfStockDash: `0 ${HEALTH_RING_CIRCUMFERENCE}`,
                inStockOffset: 0,
                lowStockOffset: 0,
                outOfStockOffset: 0,
            };
        }

        const total = health.totalProducts;
        const inStockFraction = health.inStockCount / total;
        const lowStockFraction = health.lowStockCount / total;
        const outOfStockFraction = health.outOfStockCount / total;

        const inStockLength = inStockFraction * HEALTH_RING_CIRCUMFERENCE;
        const lowStockLength = lowStockFraction * HEALTH_RING_CIRCUMFERENCE;
        const outOfStockLength = outOfStockFraction * HEALTH_RING_CIRCUMFERENCE;

        return {
            inStockCount: health.inStockCount,
            lowStockCount: health.lowStockCount,
            outOfStockCount: health.outOfStockCount,
            totalProducts: total,
            inStockPercent: Math.round(inStockFraction * 100),
            lowStockPercent: Math.round(lowStockFraction * 100),
            outOfStockPercent: Math.round(outOfStockFraction * 100),
            inStockDash: `${inStockLength.toFixed(2)} ${(HEALTH_RING_CIRCUMFERENCE - inStockLength).toFixed(2)}`,
            lowStockDash: `${lowStockLength.toFixed(2)} ${(HEALTH_RING_CIRCUMFERENCE - lowStockLength).toFixed(2)}`,
            outOfStockDash: `${outOfStockLength.toFixed(2)} ${(HEALTH_RING_CIRCUMFERENCE - outOfStockLength).toFixed(2)}`,
            inStockOffset: 0,
            lowStockOffset: -inStockLength,
            outOfStockOffset: -(inStockLength + lowStockLength),
        };
    });

    healthRingCircumference = HEALTH_RING_CIRCUMFERENCE;

    constructor(private dashboardService: DashboardService) {
        this.dashboardService.getSummary().subscribe({
            next: (summary) => {
                this.summary.set(summary);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set(this.transloco.translate('dashboard.loadError'));
                this.isLoading.set(false);
            },
        });
    }

    toggleSort(): void {
        const nextState = !this.isSortOpen();
        if (nextState) {
            this.tempSortColumn.set(this.sortColumn());
            this.tempSortDirection.set(this.sortDirection());
        }
        this.isSortOpen.set(nextState);
    }

    closeSort(): void {
        this.isSortOpen.set(false);
        this.tempSortColumn.set(this.sortColumn());
        this.tempSortDirection.set(this.sortDirection());
    }

    onColumnChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value as TopSellingSortColumn;
        this.tempSortColumn.set(value);
    }

    onDirectionChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value as SortDirection;
        this.tempSortDirection.set(value);
    }

    applySort(): void {
        this.sortColumn.set(this.tempSortColumn());
        this.sortDirection.set(this.tempSortDirection());
        this.isSortOpen.set(false);
    }

    setHoveredTimeline(index: number | null): void {
        this.hoveredTimelineIndex.set(index);
    }
}
