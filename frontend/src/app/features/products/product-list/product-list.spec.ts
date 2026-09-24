import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { ProductList } from './product-list';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const water: Product = {
    id: 'p1',
    name: 'Sparkling Water',
    reference: 'BEV-001',
    categoryId: null,
    categoryName: null,
    categoryPrefix: null,
    purchasePrice: 100,
    sellingPrice: 150,
    quantityInStock: 20,
    alertThreshold: 5,
    lowStock: false,
};

describe('ProductList', () => {
    let httpMock: HttpTestingController;
    let authServiceStub: { isAdminOrAbove: () => boolean };

    beforeEach(async () => {
        authServiceStub = { isAdminOrAbove: () => true };
        await TestBed.configureTestingModule({
            imports: [ProductList],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                transloco(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    /** Creates the fixture and flushes the constructor's initial getAll()/categories load. */
    function createLoaded(products: Product[] = [water], categories: unknown[] = []) {
        const fixture = TestBed.createComponent(ProductList);
        httpMock.expectOne((r) => r.url.endsWith('/categories') && r.method === 'GET').flush(categories);
        httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET').flush(products);
        fixture.detectChanges();
        return fixture;
    }

    it('should create and load products + categories', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.products()).toEqual([water]);
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('sets an error message when loading products fails', () => {
        const fixture = TestBed.createComponent(ProductList);
        httpMock.expectOne((r) => r.url.endsWith('/categories')).flush([]);
        httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET').flush('boom', {
            status: 500,
            statusText: 'Server Error',
        });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('applyFilters reloads all products when the search box and category filter are both empty', () => {
        const fixture = createLoaded();

        fixture.componentInstance.applyFilters();

        const req = httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET');
        req.flush([water]);
        expect(fixture.componentInstance.products()).toEqual([water]);
    });

    it('applyFilters calls search() when a query is present', () => {
        const fixture = createLoaded();
        fixture.componentInstance.filterForm.patchValue({ searchQuery: 'Water' });

        const req = httpMock.expectOne((r) => r.url.endsWith('/products/search') && r.method === 'GET');
        expect(req.request.params.get('query')).toBe('Water');
        req.flush([water]);

        expect(fixture.componentInstance.products()).toEqual([water]);
    });

    it('openCreateForm clears editingProduct and opens the form', () => {
        const fixture = createLoaded();

        fixture.componentInstance.openCreateForm();

        expect(fixture.componentInstance.editingProduct()).toBeNull();
        expect(fixture.componentInstance.isFormOpen()).toBe(true);
    });

    it('openEditForm sets editingProduct and opens the form', () => {
        const fixture = createLoaded();

        fixture.componentInstance.openEditForm(water);

        expect(fixture.componentInstance.editingProduct()).toEqual(water);
        expect(fixture.componentInstance.isFormOpen()).toBe(true);
    });

    it('closeForm hides the form and clears editingProduct', () => {
        const fixture = createLoaded();
        fixture.componentInstance.openEditForm(water);

        fixture.componentInstance.closeForm();

        expect(fixture.componentInstance.isFormOpen()).toBe(false);
        expect(fixture.componentInstance.editingProduct()).toBeNull();
    });

    it('onSaveProduct creates a product when not editing, then reloads and shows success', () => {
        const fixture = createLoaded([]);
        const formData = {
            name: 'Chips',
            reference: 'SNK-001',
            categoryId: null,
            purchasePrice: 10,
            sellingPrice: 20,
            quantityInStock: 5,
            alertThreshold: 1,
        };

        fixture.componentInstance.onSaveProduct(formData);

        const createReq = httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'POST');
        createReq.flush({ ...formData, id: 'p2', categoryName: null, categoryPrefix: null, lowStock: false });
        httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET').flush([]);

        expect(fixture.componentInstance.isFormOpen()).toBe(false);
        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('onSaveProduct updates the product when editing', () => {
        const fixture = createLoaded([water]);
        fixture.componentInstance.openEditForm(water);
        const formData = { ...water, name: 'Renamed Water' };

        fixture.componentInstance.onSaveProduct(formData);

        const updateReq = httpMock.expectOne((r) => r.url.endsWith('/products/p1') && r.method === 'PUT');
        updateReq.flush({ ...water, name: 'Renamed Water' });
        httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET').flush([{ ...water, name: 'Renamed Water' }]);

        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('sets an error message when saving a product fails', () => {
        const fixture = createLoaded([]);
        const formData = {
            name: 'Chips',
            reference: 'SNK-001',
            categoryId: null,
            purchasePrice: 10,
            sellingPrice: 20,
            quantityInStock: 5,
            alertThreshold: 1,
        };

        fixture.componentInstance.onSaveProduct(formData);

        httpMock
            .expectOne((r) => r.url.endsWith('/products') && r.method === 'POST')
            .flush('boom', { status: 409, statusText: 'Conflict' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
    });

    it('deletes a product when the user confirms, then reloads and shows success', () => {
        const fixture = createLoaded([water]);
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        fixture.componentInstance.onDeleteProduct(water);

        const deleteReq = httpMock.expectOne((r) => r.url.endsWith('/products/p1') && r.method === 'DELETE');
        deleteReq.flush(null);
        httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET').flush([]);

        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('does not delete when the user cancels the confirmation', () => {
        const fixture = createLoaded([water]);
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        fixture.componentInstance.onDeleteProduct(water);

        httpMock.expectNone((r) => r.url.endsWith('/products/p1') && r.method === 'DELETE');
    });

    it('shows the register-product button only when the actor is admin or above', () => {
        const fixture = createLoaded([]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.page-head button')).not.toBeNull();
    });

    it('hides the register-product button for non-admin actors', () => {
        authServiceStub.isAdminOrAbove = () => false;
        const fixture = createLoaded([]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.page-head button')).toBeNull();
    });
});
