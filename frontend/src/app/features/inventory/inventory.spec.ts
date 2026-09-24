import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../core/i18n/transloco-loader';
import { Product } from '../../core/models/product.model';
import { Inventory } from './inventory';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const water: Product = {
    id: 'p1',
    name: 'Water',
    reference: 'BEV-001',
    categoryId: null,
    categoryName: 'Beverages',
    categoryPrefix: 'BEV',
    purchasePrice: 10,
    sellingPrice: 20,
    quantityInStock: 30,
    alertThreshold: 5,
    lowStock: false,
};

const chips: Product = {
    id: 'p2',
    name: 'Chips',
    reference: 'SNK-001',
    categoryId: null,
    categoryName: 'Snacks',
    categoryPrefix: 'SNK',
    purchasePrice: 5,
    sellingPrice: 15,
    quantityInStock: 10,
    alertThreshold: 5,
    lowStock: false,
};

describe('Inventory', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Inventory],
            providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), transloco()],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    function createLoaded(products: Product[] = [water, chips]) {
        const fixture = TestBed.createComponent(Inventory);
        httpMock.expectOne((r) => r.url.endsWith('/products') && r.method === 'GET').flush(products);
        fixture.detectChanges();
        return fixture;
    }

    it('should create and load products', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.products()).toEqual([water, chips]);
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('sets an error message when loading fails', () => {
        const fixture = TestBed.createComponent(Inventory);
        httpMock.expectOne((r) => r.url.endsWith('/products')).flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('defaults to sorting by name ascending', () => {
        const fixture = createLoaded();

        expect(fixture.componentInstance['sortedProducts']()).toEqual([chips, water]);
    });

    it('sortData toggles direction when the same column is clicked again', () => {
        const fixture = createLoaded();

        fixture.componentInstance['sortData']({ active: 'name' });
        expect(fixture.componentInstance['sort']()).toEqual({ active: 'name', direction: 'desc' });

        fixture.componentInstance['sortData']({ active: 'name' });
        expect(fixture.componentInstance['sort']()).toEqual({ active: 'name', direction: 'asc' });
    });

    it('sortData resets to ascending when a different column is clicked', () => {
        const fixture = createLoaded();

        fixture.componentInstance['sortData']({ active: 'quantity' });

        expect(fixture.componentInstance['sort']()).toEqual({ active: 'quantity', direction: 'asc' });
        expect(fixture.componentInstance['sortedProducts']()).toEqual([chips, water]);
    });

    it('startAdjust opens the adjust form pre-filled with the current quantity', () => {
        const fixture = createLoaded();

        fixture.componentInstance.startAdjust(water);

        expect(fixture.componentInstance.adjustingProductId()).toBe('p1');
        expect(fixture.componentInstance.adjustForm.value.newQuantity).toBe(30);
    });

    it('cancelAdjust closes the adjust form', () => {
        const fixture = createLoaded();
        fixture.componentInstance.startAdjust(water);

        fixture.componentInstance.cancelAdjust();

        expect(fixture.componentInstance.adjustingProductId()).toBeNull();
    });

    it('does not submit an invalid adjustment', () => {
        const fixture = createLoaded();
        fixture.componentInstance.startAdjust(water);
        fixture.componentInstance.adjustForm.get('newQuantity')?.setValue(-1);

        fixture.componentInstance.saveAdjust(water);

        httpMock.expectNone((r) => r.url.endsWith('/inventory/adjust'));
        expect(fixture.componentInstance.adjustForm.get('newQuantity')?.touched).toBe(true);
    });

    it('saveAdjust posts the adjustment and updates the product list on success', () => {
        const fixture = createLoaded();
        fixture.componentInstance.startAdjust(water);
        fixture.componentInstance.adjustForm.setValue({ newQuantity: 50, comment: 'recount' });

        fixture.componentInstance.saveAdjust(water);

        const req = httpMock.expectOne((r) => r.url.endsWith('/inventory/adjust') && r.method === 'POST');
        expect(req.request.body).toEqual({ productId: 'p1', newQuantity: 50, comment: 'recount', userId: null });
        req.flush({ ...water, quantityInStock: 50 });

        expect(fixture.componentInstance.adjustingProductId()).toBeNull();
        expect(fixture.componentInstance.products().find((p) => p.id === 'p1')?.quantityInStock).toBe(50);
        expect(fixture.componentInstance.successMessage()).not.toBe('');
    });

    it('sets an error message when saveAdjust fails', () => {
        const fixture = createLoaded();
        fixture.componentInstance.startAdjust(water);
        fixture.componentInstance.adjustForm.setValue({ newQuantity: 50, comment: '' });

        fixture.componentInstance.saveAdjust(water);

        httpMock
            .expectOne((r) => r.url.endsWith('/inventory/adjust'))
            .flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isSaving()).toBe(false);
    });
});
