import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { DashboardSummary } from '../../../core/models/dashboard.model';
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
    topSellingProducts: [{ productId: 'p1', productName: 'Water', productUnitPrice: 150, quantitySold: 9 }],
    lowStockProducts: [],
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
});
