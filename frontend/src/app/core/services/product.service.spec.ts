import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';

describe('ProductService', () => {
    let service: ProductService;
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
        service = TestBed.inject(ProductService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAll() issues a GET to the products base URL', () => {
        service.getAll().subscribe((res) => expect(res).toEqual([product]));
        const req = httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET');
        req.flush([product]);
    });

    it('getById() issues a GET to /products/{id}', () => {
        service.getById('p1').subscribe((res) => expect(res).toEqual(product));
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/p1') && r.method === 'GET');
        req.flush(product);
    });

    it('search() sends query and categoryId as params when both provided', () => {
        service.search('water', 'cat-1').subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/search') && r.method === 'GET');
        expect(req.request.params.get('query')).toBe('water');
        expect(req.request.params.get('categoryId')).toBe('cat-1');
        req.flush([product]);
    });

    it('search() omits query param when blank and categoryId param when null', () => {
        service.search('', null).subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/search') && r.method === 'GET');
        expect(req.request.params.has('query')).toBe(false);
        expect(req.request.params.has('categoryId')).toBe(false);
        req.flush([product]);
    });

    it('create() POSTs the form data with the actor userId attached', () => {
        service
            .create({ name: 'Water', reference: 'BEV-1', purchasePrice: 100, sellingPrice: 150, quantityInStock: 25, alertThreshold: 5 })
            .subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'POST');
        expect(req.request.body.userId).toBe('actor-1');
        expect(req.request.body.name).toBe('Water');
        req.flush(product);
    });

    it('update() PUTs to /products/{id} with the actor userId attached', () => {
        service
            .update('p1', { name: 'Water', reference: 'BEV-1', purchasePrice: 100, sellingPrice: 150, quantityInStock: 25, alertThreshold: 5 })
            .subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/p1') && r.method === 'PUT');
        expect(req.request.body.userId).toBe('actor-1');
        req.flush(product);
    });

    it('delete() issues a DELETE with the actor userId as a query param', () => {
        service.delete('p1').subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/p1') && r.method === 'DELETE');
        expect(req.request.params.get('userId')).toBe('actor-1');
        req.flush(null);
    });

    it('getNextRef() requests text response with prefix and userId params', () => {
        service.getNextRef('BEV').subscribe((res) => expect(res).toBe('BEV-003'));
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/next-ref') && r.method === 'GET');
        expect(req.request.params.get('prefix')).toBe('BEV');
        expect(req.request.params.get('userId')).toBe('actor-1');
        req.flush('BEV-003');
    });

    it('checkRefAvailability() issues a GET with reference and userId params', () => {
        service.checkRefAvailability('BEV-1').subscribe((res) => expect(res.available).toBe(false));
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/check-availability') && r.method === 'GET');
        expect(req.request.params.get('reference')).toBe('BEV-1');
        expect(req.request.params.get('userId')).toBe('actor-1');
        req.flush({ available: false });
    });
});
