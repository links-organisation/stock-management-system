import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { AuthService } from './auth.service';
import { Category } from '../models/category.model';

describe('CategoryService', () => {
    let service: CategoryService;
    let httpMock: HttpTestingController;
    const authServiceStub = { currentUserId: 'actor-1' };

    const category: Category = { id: 'c1', name: 'Beverages', prefix: 'BEV', description: null };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        });
        service = TestBed.inject(CategoryService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAll() issues a GET to the categories base URL', () => {
        service.getAll().subscribe((categories) => expect(categories).toEqual([category]));
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories') && r.method === 'GET');
        req.flush([category]);
    });

    it('getById() issues a GET to /categories/{id}', () => {
        service.getById('c1').subscribe((c) => expect(c).toEqual(category));
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories/c1') && r.method === 'GET');
        req.flush(category);
    });

    it('create() POSTs the form data with the actor userId attached', () => {
        service.create({ name: 'Dairy', prefix: 'DRY', description: 'Milk' }).subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories') && r.method === 'POST');
        expect(req.request.body).toEqual({ name: 'Dairy', prefix: 'DRY', description: 'Milk', userId: 'actor-1' });
        req.flush(category);
    });

    it('update() PUTs to /categories/{id} with the actor userId attached', () => {
        service.update('c1', { name: 'Beverages 2', prefix: 'BEV' }).subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories/c1') && r.method === 'PUT');
        expect(req.request.body).toEqual({ name: 'Beverages 2', prefix: 'BEV', userId: 'actor-1' });
        req.flush(category);
    });

    it('checkAvailability() issues a GET with column/value/userId query params', () => {
        service.checkAvailability('name', 'Dairy').subscribe((res) => expect(res.available).toBe(true));
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories/check-availability') && r.method === 'GET');
        expect(req.request.params.get('column')).toBe('name');
        expect(req.request.params.get('value')).toBe('Dairy');
        expect(req.request.params.get('userId')).toBe('actor-1');
        req.flush({ available: true });
    });

    it('delete() issues a DELETE with the actor userId as a query param', () => {
        service.delete('c1').subscribe();
        const req = httpMock.expectOne((r) => r.url.endsWith('/categories/c1') && r.method === 'DELETE');
        expect(req.request.params.get('userId')).toBe('actor-1');
        req.flush(null);
    });
});
