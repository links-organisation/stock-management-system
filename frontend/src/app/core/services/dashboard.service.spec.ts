import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from '../models/dashboard.model';

describe('DashboardService', () => {
    let service: DashboardService;
    let httpMock: HttpTestingController;

    const summary: DashboardSummary = {
        totalStockValue: 1000,
        totalSalesCount: 5,
        revenueToday: 100,
        revenueThisWeek: 500,
        revenueThisMonth: 2000,
        topSellingProducts: [],
        lowStockProducts: [],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(DashboardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getSummary() issues a GET to /dashboard/summary and returns the body', () => {
        service.getSummary().subscribe((res) => expect(res).toEqual(summary));

        const req = httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary') && r.method === 'GET');
        req.flush(summary);
    });
});
