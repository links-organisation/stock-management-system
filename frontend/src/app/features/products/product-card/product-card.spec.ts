import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { Product } from '../../../core/models/product.model';
import { ProductCard } from './product-card';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const product: Product = {
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

describe('ProductCard', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProductCard],
            providers: [provideZonelessChangeDetection(), transloco()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', product);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('renders the product name and reference', async () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', product);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('Sparkling Water');
        expect(text).toContain('BEV-001');
    });

    it('does not show manage actions by default', () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', product);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('footer')).toBeNull();
    });

    it('shows manage actions when canManage is true', () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', product);
        fixture.componentRef.setInput('canManage', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('footer')).not.toBeNull();
        expect(fixture.nativeElement.querySelectorAll('footer button').length).toBe(2);
    });

    it('emits edit with the product when the edit button is clicked', () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', product);
        fixture.componentRef.setInput('canManage', true);
        fixture.detectChanges();
        const emitted: Product[] = [];
        fixture.componentInstance.edit.subscribe((p) => emitted.push(p));

        const [editButton] = fixture.nativeElement.querySelectorAll('footer button');
        editButton.click();

        expect(emitted).toEqual([product]);
    });

    it('emits remove with the product when the delete button is clicked', () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', product);
        fixture.componentRef.setInput('canManage', true);
        fixture.detectChanges();
        const emitted: Product[] = [];
        fixture.componentInstance.remove.subscribe((p) => emitted.push(p));

        const [, deleteButton] = fixture.nativeElement.querySelectorAll('footer button');
        deleteButton.click();

        expect(emitted).toEqual([product]);
    });

    it('shows the low-stock warning when lowStock is true', () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', { ...product, lowStock: true });
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.warning')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.card--low')).not.toBeNull();
    });

    it('does not show the low-stock warning when lowStock is false', () => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', product);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.warning')).toBeNull();
    });
});
