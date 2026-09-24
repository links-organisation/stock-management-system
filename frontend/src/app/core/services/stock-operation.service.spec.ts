import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StockOperationService } from './stock-operation.service';
import { StockOperation } from '../models/stock-operation.model';

describe('StockOperationService', () => {
    let service: StockOperationService;
    let httpMock: HttpTestingController;

    const operation: StockOperation = {
        id: 'op1',
        operationType: 'ADJUSTMENT',
        productId: 'p1',
        productName: 'Water',
        quantityChange: 5,
        operationDate: '2026-01-01T00:00:00',
        comment: 'recount',
        performedByUserId: 'u1',
        performedByUsername: 'admin',
        performedByFullname: 'Store Admin',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(StockOperationService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAll() with no filter issues a plain GET with no query params', () => {
        service.getAll().subscribe((res) => expect(res).toEqual([operation]));
        const req = httpMock.expectOne((r) => r.url.endsWith('/stock-operations') && r.method === 'GET');
        expect(req.request.params.keys().length).toBe(0);
        req.flush([operation]);
    });

    it('getAll() forwards every provided filter field as a query param', () => {
        service
            .getAll({ productId: 'p1', type: 'ADJUSTMENT', userId: 'u1', from: '2026-01-01', to: '2026-01-31' })
            .subscribe();

        const req = httpMock.expectOne((r) => r.url.endsWith('/stock-operations') && r.method === 'GET');
        expect(req.request.params.get('productId')).toBe('p1');
        expect(req.request.params.get('type')).toBe('ADJUSTMENT');
        expect(req.request.params.get('userId')).toBe('u1');
        expect(req.request.params.get('from')).toBe('2026-01-01');
        expect(req.request.params.get('to')).toBe('2026-01-31');
        req.flush([operation]);
    });

    it('getAll() omits a falsy type filter (empty string)', () => {
        service.getAll({ type: '' }).subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/stock-operations') && r.method === 'GET');
        expect(req.request.params.has('type')).toBe(false);
        req.flush([]);
    });
});
