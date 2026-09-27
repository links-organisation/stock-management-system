import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '@core/i18n/transloco-loader';
import { DashboardSummary } from '@core/models/dashboard.model';
import { Dashboard } from './dashboard';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const summary: DashboardSummary = {
    totalStockValue: 100000,
    totalSalesCount: 12,
    revenueToday: 5000,
    revenueThisWeek: 20000,
    revenueThisMonth: 80000,
    topSellingProducts: [
        { productId: 'p1', productName: 'Water', productUnitPrice: 150, quantitySold: 9 },
        { productId: 'p2', productName: 'Apple', productUnitPrice: 500, quantitySold: 3 },
        { productId: 'p3', productName: 'Bread', productUnitPrice: 200, quantitySold: 15 },
    ],
    lowStockProducts: [],
    categoryDistribution: [
        { categoryId: 'c1', categoryName: 'Beverages', productCount: 5, stockValue: 60000, salesRevenue: 25000 },
        { categoryId: 'c2', categoryName: 'Bakery', productCount: 3, stockValue: 40000, salesRevenue: 15000 },
    ],
    salesTimeline: [
        { date: '2026-09-19', label: 'Sat', revenue: 0, orderCount: 0 },
        { date: '2026-09-20', label: 'Sun', revenue: 0, orderCount: 0 },
        { date: '2026-09-21', label: 'Mon', revenue: 3000, orderCount: 2 },
        { date: '2026-09-22', label: 'Tue', revenue: 5000, orderCount: 3 },
        { date: '2026-09-23', label: 'Wed', revenue: 4000, orderCount: 2 },
        { date: '2026-09-24', label: 'Thu', revenue: 6000, orderCount: 4 },
        { date: '2026-09-25', label: 'Fri', revenue: 2000, orderCount: 1 },
    ],
    productProfits: [
        { productId: 'p1', productName: 'Water', totalRevenue: 1350, totalCost: 900, totalProfit: 450, profitMarginPercentage: 33.33 },
        { productId: 'p3', productName: 'Bread', totalRevenue: 3000, totalCost: 2000, totalProfit: 1000, profitMarginPercentage: 33.33 },
    ],
    stockHealth: {
        inStockCount: 8,
        lowStockCount: 1,
        outOfStockCount: 1,
        totalProducts: 10,
    },
};

describe('Dashboard', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Dashboard],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                transloco(),
            ],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should create and load the summary', () => {
        const fixture = TestBed.createComponent(Dashboard);
        httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary') && r.method === 'GET').flush(summary);

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.summary()).toEqual(summary);
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('sets an error message when loading fails', () => {
        const fixture = TestBed.createComponent(Dashboard);
        httpMock
            .expectOne((r) => r.url.endsWith('/dashboard/summary'))
            .flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('renders the top-selling product name and revenue (unitPrice * quantitySold)', async () => {
        const fixture = TestBed.createComponent(Dashboard);
        httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary')).flush(summary);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Water');
        // 150 * 9 = 1350
        expect(text).toContain('1');
        expect(text).toContain('350');
    });

    it('shows the empty low-stock state when there are no low-stock products', async () => {
        const fixture = TestBed.createComponent(Dashboard);
        httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary')).flush(summary);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.alerts')).toBeNull();
    });

    it('toggles sort popover open and close', async () => {
        const fixture = TestBed.createComponent(Dashboard);
        httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary')).flush(summary);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const component = fixture.componentInstance;
        expect(component.isSortOpen()).toBe(false);
        expect(fixture.nativeElement.querySelector('.sort-popover')).toBeNull();

        const sortToggleBtn = fixture.nativeElement.querySelector('.sort-toggle-btn');
        sortToggleBtn.click();
        fixture.detectChanges();

        expect(component.isSortOpen()).toBe(true);
        expect(fixture.nativeElement.querySelector('.sort-popover')).not.toBeNull();

        const closeBtn = fixture.nativeElement.querySelector('.sort-popover__close');
        closeBtn.click();
        fixture.detectChanges();

        expect(component.isSortOpen()).toBe(false);
        expect(fixture.nativeElement.querySelector('.sort-popover')).toBeNull();
    });

    it('sorts top-selling products by column and direction', async () => {
        const fixture = TestBed.createComponent(Dashboard);
        httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary')).flush(summary);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const component = fixture.componentInstance;
        // Default sort: quantitySold desc -> Bread (15), Water (9), Apple (3)
        expect(component.sortedTopSellingProducts().map((p) => p.productName)).toEqual(['Bread', 'Water', 'Apple']);

        // Sort by productName asc
        component.tempSortColumn.set('productName');
        component.tempSortDirection.set('asc');
        component.applySort();
        fixture.detectChanges();

        expect(component.sortedTopSellingProducts().map((p) => p.productName)).toEqual(['Apple', 'Bread', 'Water']);

        // Sort by totalPrice desc -> Bread (200*15=3000), Apple (500*3=1500), Water (150*9=1350)
        component.tempSortColumn.set('totalPrice');
        component.tempSortDirection.set('desc');
        component.applySort();
        fixture.detectChanges();

        expect(component.sortedTopSellingProducts().map((p) => p.productName)).toEqual(['Bread', 'Apple', 'Water']);
    });

    it('renders native SVG diagrams for sales timeline, category donut, product profits, and stock health', async () => {
        const fixture = TestBed.createComponent(Dashboard);
        httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary')).flush(summary);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const component = fixture.componentInstance;
        const nativeElement = fixture.nativeElement as HTMLElement;

        // Timeline checks
        expect(component.timelineBars().length).toBe(7);
        expect(nativeElement.querySelector('.timeline-svg')).not.toBeNull();
        expect(nativeElement.querySelectorAll('.bar-group').length).toBe(7);

        // Category donut checks
        expect(component.donutSlices().length).toBe(2);
        expect(nativeElement.querySelector('.donut-svg')).not.toBeNull();
        expect(nativeElement.querySelectorAll('.legend-item').length).toBe(2);
        expect(nativeElement.textContent).toContain('Beverages');
        expect(nativeElement.textContent).toContain('Bakery');

        // Profitability checks
        expect(component.productProfits().length).toBe(2);
        expect(nativeElement.querySelectorAll('.profit-item').length).toBe(2);

        // Stock health checks
        expect(component.stockHealth().totalProducts).toBe(10);
        expect(component.stockHealth().inStockPercent).toBe(80);
        expect(nativeElement.querySelector('.health-ring-svg')).not.toBeNull();
        expect(nativeElement.querySelectorAll('.health-card').length).toBe(3);
    });
});
