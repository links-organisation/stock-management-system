import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { Product } from '../../../core/models/product.model';
import { Sale } from './sale';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

function product(overrides: Partial<Product> = {}): Product {
    return {
        id: 'p1',
        name: 'Water',
        reference: 'BEV-1',
        categoryId: null,
        categoryName: null,
        categoryPrefix: null,
        purchasePrice: 50,
        sellingPrice: 100,
        quantityInStock: 20,
        alertThreshold: 5,
        lowStock: false,
        ...overrides,
    };
}

describe('Sale', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Sale],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                transloco(),
            ],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    function createAndFlushProducts(products: Product[] = [product()]) {
        const fixture = TestBed.createComponent(Sale);
        const req = httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/products'));
        req.flush(products);
        fixture.detectChanges();
        return fixture;
    }

    it('should create and load products on construction', () => {
        const fixture = createAndFlushProducts([product()]);
        expect(fixture.componentInstance.products()).toHaveLength(1);
    });

    it('onAddToCart adds a new line for a product not yet in the cart', () => {
        const fixture = createAndFlushProducts();
        const water = product({ id: 'p1', name: 'Water', sellingPrice: 100 });

        fixture.componentInstance.onAddToCart({ product: water, quantity: 2 });

        expect(fixture.componentInstance.cart()).toEqual([
            { productId: 'p1', productName: 'Water', quantity: 2, unitPrice: 100 },
        ]);
    });

    it('onAddToCart merges quantity into an existing line for the same product', () => {
        const fixture = createAndFlushProducts();
        const water = product({ id: 'p1', sellingPrice: 100 });

        fixture.componentInstance.onAddToCart({ product: water, quantity: 2 });
        fixture.componentInstance.onAddToCart({ product: water, quantity: 3 });

        expect(fixture.componentInstance.cart()).toHaveLength(1);
        expect(fixture.componentInstance.cart()[0].quantity).toBe(5);
    });

    it('onRemoveLine removes only the matching line', () => {
        const fixture = createAndFlushProducts();
        fixture.componentInstance.onAddToCart({ product: product({ id: 'p1' }), quantity: 1 });
        fixture.componentInstance.onAddToCart({ product: product({ id: 'p2' }), quantity: 1 });

        fixture.componentInstance.onRemoveLine('p1');

        expect(fixture.componentInstance.cart().map((l) => l.productId)).toEqual(['p2']);
    });

    it('onCheckout does nothing when the cart is empty', () => {
        const fixture = createAndFlushProducts();

        fixture.componentInstance.onCheckout();

        httpMock.expectNone((r) => r.method === 'POST' && r.url.includes('/sales'));
        expect(fixture.componentInstance.isSubmitting()).toBe(false);
    });

    it('onCheckout posts the cart items, then clears the cart and shows a success message', () => {
        const fixture = createAndFlushProducts();
        fixture.componentInstance.onAddToCart({ product: product({ id: 'p1' }), quantity: 2 });

        fixture.componentInstance.onCheckout();

        const saleReq = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/sales'));
        expect(saleReq.request.body.items).toEqual([{ productId: 'p1', quantity: 2 }]);
        saleReq.flush({ id: 'sale-1', items: [] });

        // loadProducts() is called again on success
        const reloadReq = httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/products'));
        reloadReq.flush([]);

        expect(fixture.componentInstance.isSubmitting()).toBe(false);
        expect(fixture.componentInstance.cart()).toEqual([]);
        expect(fixture.componentInstance.successMessage()).toContain('sale-1');
    });

    it('onCheckout surfaces the backend error message on failure', () => {
        const fixture = createAndFlushProducts();
        fixture.componentInstance.onAddToCart({ product: product({ id: 'p1' }), quantity: 1 });

        fixture.componentInstance.onCheckout();

        const saleReq = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/sales'));
        saleReq.flush({ message: 'Insufficient stock' }, { status: 400, statusText: 'Bad Request' });

        expect(fixture.componentInstance.isSubmitting()).toBe(false);
        expect(fixture.componentInstance.errorMessage()).toBe('Insufficient stock');
        // cart is preserved on failure
        expect(fixture.componentInstance.cart()).toHaveLength(1);
    });
});
