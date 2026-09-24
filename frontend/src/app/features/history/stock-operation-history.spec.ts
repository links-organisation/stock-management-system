import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../core/i18n/transloco-loader';
import { StockOperation } from '../../core/models/stock-operation.model';
import { StockOperationHistory } from './stock-operation-history';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const operation: StockOperation = {
    id: 'op1',
    operationType: 'ADJUSTMENT',
    productId: 'p1',
    productName: 'Water',
    quantityChange: 5,
    operationDate: '2026-01-01T10:00:00',
    comment: 'recount',
    performedByUserId: 'u1',
    performedByUsername: 'admin',
    performedByFullname: 'Shop Admin',
};

describe('StockOperationHistory', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StockOperationHistory],
            providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), transloco()],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    function createLoaded(operations: StockOperation[] = [operation]) {
        const fixture = TestBed.createComponent(StockOperationHistory);
        httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET').flush([]);
        httpMock.expectOne((r) => r.url.endsWith('/stock-operations') && r.method === 'GET').flush(operations);
        fixture.detectChanges();
        return fixture;
    }

    it('should create and load operations + products', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.operations()).toEqual([operation]);
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('sets an error message when loading operations fails', () => {
        const fixture = TestBed.createComponent(StockOperationHistory);
        httpMock.expectOne((r) => r.url.endsWith('/products')).flush([]);
        httpMock
            .expectOne((r) => r.url.endsWith('/stock-operations'))
            .flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('re-fetches with the type filter as a query param when it changes', () => {
        const fixture = createLoaded();

        fixture.componentInstance.filterForm.patchValue({ typeFilter: 'SALE' });

        const req = httpMock.expectOne((r) => r.url.endsWith('/stock-operations') && r.method === 'GET');
        expect(req.request.params.get('type')).toBe('SALE');
        req.flush([]);
    });

    it('re-fetches with the product filter as a query param when it changes', () => {
        const fixture = createLoaded();

        fixture.componentInstance.filterForm.patchValue({ productFilter: 'p1' });

        const req = httpMock.expectOne((r) => r.url.endsWith('/stock-operations') && r.method === 'GET');
        expect(req.request.params.get('productId')).toBe('p1');
        req.flush([]);
    });

    it('omits filter params that are left blank', () => {
        const fixture = createLoaded();

        fixture.componentInstance.filterForm.patchValue({ fromFilter: '2026-01-01' });

        const req = httpMock.expectOne((r) => r.url.endsWith('/stock-operations') && r.method === 'GET');
        expect(req.request.params.get('from')).toBe('2026-01-01');
        expect(req.request.params.has('type')).toBe(false);
        expect(req.request.params.has('to')).toBe(false);
        req.flush([]);
    });

    it('exposes the operationTypeLabelKey map for template translation lookups', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance.operationTypeLabelKey['ADJUSTMENT']).toBe('operationType.adjustment');
        expect(fixture.componentInstance.operationTypeLabelKey['SALE']).toBe('operationType.sale');
        expect(fixture.componentInstance.operationTypeLabelKey['REGISTRATION']).toBe('operationType.registration');
    });
});
