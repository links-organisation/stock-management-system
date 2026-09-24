import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { Product } from '../../../core/models/product.model';
import { ProductPick, ProductSelector } from './product-selector';

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

describe('ProductSelector', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProductSelector],
            providers: [provideZonelessChangeDetection(), transloco()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ProductSelector);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('selectedProduct is null when nothing is selected', () => {
        const fixture = TestBed.createComponent(ProductSelector);
        fixture.componentRef.setInput('products', [product()]);
        fixture.detectChanges();

        expect(fixture.componentInstance.selectedProduct()).toBeNull();
    });

    it('selectedProduct resolves from products() once selectedProductId changes', async () => {
        const fixture = TestBed.createComponent(ProductSelector);
        const water = product({ id: 'p1' });
        const chips = product({ id: 'p2', name: 'Chips' });
        fixture.componentRef.setInput('products', [water, chips]);
        fixture.detectChanges();

        fixture.componentInstance.form.controls.selectedProductId.setValue('p2');
        fixture.detectChanges();

        expect(fixture.componentInstance.selectedProduct()).toEqual(chips);
    });

    it('onAdd emits the picked product and quantity, then resets quantity to 1', () => {
        const fixture = TestBed.createComponent(ProductSelector);
        const water = product({ id: 'p1' });
        fixture.componentRef.setInput('products', [water]);
        fixture.detectChanges();
        fixture.componentInstance.form.controls.selectedProductId.setValue('p1');
        fixture.componentInstance.form.controls.quantity.setValue(3);

        const picks: ProductPick[] = [];
        fixture.componentInstance.add.subscribe((pick) => picks.push(pick));

        fixture.componentInstance.onAdd();

        expect(picks).toEqual([{ product: water, quantity: 3 }]);
        expect(fixture.componentInstance.form.controls.quantity.value).toBe(1);
    });

    it('onAdd does nothing when no product is selected', () => {
        const fixture = TestBed.createComponent(ProductSelector);
        fixture.componentRef.setInput('products', [product()]);
        fixture.detectChanges();

        const picks: ProductPick[] = [];
        fixture.componentInstance.add.subscribe((pick) => picks.push(pick));

        fixture.componentInstance.onAdd();

        expect(picks).toEqual([]);
    });

    it('onAdd does nothing when quantity is below 1', () => {
        const fixture = TestBed.createComponent(ProductSelector);
        const water = product({ id: 'p1' });
        fixture.componentRef.setInput('products', [water]);
        fixture.detectChanges();
        fixture.componentInstance.form.controls.selectedProductId.setValue('p1');
        fixture.componentInstance.form.controls.quantity.setValue(0);

        const picks: ProductPick[] = [];
        fixture.componentInstance.add.subscribe((pick) => picks.push(pick));

        fixture.componentInstance.onAdd();

        expect(picks).toEqual([]);
    });
});
