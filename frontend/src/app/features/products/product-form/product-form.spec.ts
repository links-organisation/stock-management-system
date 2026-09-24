import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { Product } from '../../../core/models/product.model';
import { ProductForm } from './product-form';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const existingProduct: Product = {
    id: 'p1',
    name: 'Sparkling Water',
    reference: 'BEV-001',
    categoryId: 'c1',
    categoryName: 'Beverages',
    categoryPrefix: 'BEV',
    purchasePrice: 100,
    sellingPrice: 150,
    quantityInStock: 20,
    alertThreshold: 5,
    lowStock: false,
};

describe('ProductForm', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProductForm],
            providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), transloco()],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should create in "register" mode with an empty form by default', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.detectChanges();
        // The reference field starts blank; the async uniqueness validator fires on it
        // regardless (no blank-guard on this field, unlike the category-list form).
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.isEditing()).toBe(false);
        expect(fixture.componentInstance.form.value.name).toBe('');
    });

    it('populates the form and switches to "editing" mode when a product input is provided', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.componentRef.setInput('product', existingProduct);
        fixture.detectChanges();
        httpMock
            .match((r) => r.url.endsWith('/products/check-availability'))
            .forEach((req) => req.flush({ available: true }));

        expect(fixture.componentInstance.isEditing()).toBe(true);
        expect(fixture.componentInstance.form.value.name).toBe('Sparkling Water');
        expect(fixture.componentInstance.form.value.reference).toBe('BEV-001');
    });

    it('flags the reference field notUnique when it collides with another product', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.detectChanges();
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });

        fixture.componentInstance.form.get('reference')?.setValue('BEV-999');
        const req = httpMock.expectOne((r) => r.url.endsWith('/products/check-availability'));
        expect(req.request.params.get('reference')).toBe('BEV-999');
        req.flush({ available: false });

        expect(fixture.componentInstance.form.get('reference')?.hasError('notUnique')).toBe(true);
    });

    it('does not flag notUnique when editing and the reference is unchanged for the same category', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.componentRef.setInput('product', existingProduct);
        fixture.detectChanges();
        httpMock
            .match((r) => r.url.endsWith('/products/check-availability'))
            .forEach((req) => req.flush({ available: false }));

        // Because product().categoryId === form.value.categoryId (both 'c1'), the
        // notUnique error must not be set even though availability reported false.
        expect(fixture.componentInstance.form.get('reference')?.hasError('notUnique')).toBe(false);
    });

    it('auto-fills the reference from getNextRef when a different category is selected', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.componentRef.setInput('categories', [{ id: 'c2', name: 'Snacks', prefix: 'SNK', description: null }]);
        fixture.detectChanges();
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });

        fixture.componentInstance.form.get('categoryId')?.setValue('c2');

        const nextRefReq = httpMock.expectOne((r) => r.url.endsWith('/products/next-ref'));
        expect(nextRefReq.request.params.get('prefix')).toBe('SNK');
        nextRefReq.flush('SNK-004');
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });

        expect(fixture.componentInstance.form.get('reference')?.value).toBe('SNK-004');
    });

    it('restores the original reference when the category is changed back to the editing product\'s own category', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.componentRef.setInput('product', existingProduct);
        fixture.componentRef.setInput('categories', [{ id: 'c1', name: 'Beverages', prefix: 'BEV', description: null }]);
        fixture.detectChanges();
        httpMock
            .match((r) => r.url.endsWith('/products/check-availability'))
            .forEach((req) => req.flush({ available: true }));

        fixture.componentInstance.form.get('categoryId')?.setValue('c1');

        httpMock.expectNone((r) => r.url.endsWith('/products/next-ref'));
        httpMock
            .match((r) => r.url.endsWith('/products/check-availability'))
            .forEach((req) => req.flush({ available: true }));
        expect(fixture.componentInstance.form.get('reference')?.value).toBe('BEV-001');
    });

    it('does not submit an invalid form', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.detectChanges();
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });
        const emitted: unknown[] = [];
        fixture.componentInstance.save.subscribe((v) => emitted.push(v));

        fixture.componentInstance.onSubmit();

        expect(emitted).toEqual([]);
        expect(fixture.componentInstance.form.get('name')?.touched).toBe(true);
    });

    it('emits save with the form value when submitted while valid', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.detectChanges();
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });
        fixture.componentInstance.form.setValue({
            name: 'Chips',
            reference: 'SNK-001',
            categoryId: null,
            purchasePrice: 10,
            sellingPrice: 20,
            quantityInStock: 5,
            alertThreshold: 1,
        });
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });
        const emitted: unknown[] = [];
        fixture.componentInstance.save.subscribe((v) => emitted.push(v));

        fixture.componentInstance.onSubmit();

        expect(emitted).toEqual([
            {
                name: 'Chips',
                reference: 'SNK-001',
                categoryId: null,
                purchasePrice: 10,
                sellingPrice: 20,
                quantityInStock: 5,
                alertThreshold: 1,
            },
        ]);
    });

    it('emits cancel when the cancel button is clicked', () => {
        const fixture = TestBed.createComponent(ProductForm);
        fixture.detectChanges();
        httpMock.expectOne((r) => r.url.endsWith('/products/check-availability')).flush({ available: true });
        let cancelled = false;
        fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

        fixture.componentInstance.cancel.emit();

        expect(cancelled).toBe(true);
    });
});
