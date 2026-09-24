import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryService } from './inventory.service';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';

describe('InventoryService', () => {
    let service: InventoryService;
    let httpMock: HttpTestingController;
    const authServiceStub = { currentUserId: 'actor-1' };

    const product: Product = {
        id: 'p1',
        name: 'Water',
        reference: 'BEV-1',
        categoryId: null,
        categoryName: null,
        categoryPrefix: null,
        purchasePrice: 100,
        sellingPrice: 150,
        quantityInStock: 25,
        alertThreshold: 5,
        lowStock: false,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        });
        service = TestBed.inject(InventoryService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('adjust() POSTs productId/newQuantity/comment/userId to /inventory/adjust', () => {
        service.adjust('p1', 25, 'recount').subscribe((res) => expect(res).toEqual(product));

        const req = httpMock.expectOne((r) => r.url.endsWith('/inventory/adjust') && r.method === 'POST');
        expect(req.request.body).toEqual({
            productId: 'p1',
            newQuantity: 25,
            comment: 'recount',
            userId: 'actor-1',
        });
        req.flush(product);
    });

    it('adjust() omits comment when not provided', () => {
        service.adjust('p1', 25).subscribe();

        const req = httpMock.expectOne((r) => r.url.endsWith('/inventory/adjust') && r.method === 'POST');
        expect(req.request.body).toEqual({
            productId: 'p1',
            newQuantity: 25,
            comment: undefined,
            userId: 'actor-1',
        });
        req.flush(product);
    });
});
