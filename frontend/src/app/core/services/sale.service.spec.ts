import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SaleService } from './sale.service';
import { AuthService } from './auth.service';
import { Sale } from '../models/sale.model';

describe('SaleService', () => {
    let service: SaleService;
    let httpMock: HttpTestingController;
    const authServiceStub = { currentUserId: 'actor-1' };

    const sale: Sale = {
        id: 's1',
        saleDate: '2026-01-01T00:00:00',
        totalAmount: 500,
        customerName: null,
        performedByUserId: 'actor-1',
        performedByUsername: 'seller',
        performedByFullname: 'Seller One',
        items: [],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        });
        service = TestBed.inject(SaleService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAll() issues a GET to the sales base URL', () => {
        service.getAll().subscribe((res) => expect(res).toEqual([sale]));
        const req = httpMock.expectOne((r) => r.url.endsWith('/sales') && r.method === 'GET');
        req.flush([sale]);
    });

    it('getById() issues a GET to /sales/{id}', () => {
        service.getById('s1').subscribe((res) => expect(res).toEqual(sale));
        const req = httpMock.expectOne((r) => r.url.endsWith('/sales/s1') && r.method === 'GET');
        req.flush(sale);
    });

    it('createSale() POSTs userId, customerName, and items', () => {
        const items = [{ productId: 'p1', quantity: 2 }];
        service.createSale(items, 'Walk-in').subscribe((res) => expect(res).toEqual(sale));

        const req = httpMock.expectOne((r) => r.url.endsWith('/sales') && r.method === 'POST');
        expect(req.request.body).toEqual({ userId: 'actor-1', customerName: 'Walk-in', items });
        req.flush(sale);
    });

    it('createSale() omits customerName when not provided', () => {
        const items = [{ productId: 'p1', quantity: 1 }];
        service.createSale(items).subscribe();

        const req = httpMock.expectOne((r) => r.url.endsWith('/sales') && r.method === 'POST');
        expect(req.request.body.customerName).toBeUndefined();
        expect(req.request.body.items).toEqual(items);
        req.flush(sale);
    });
});
