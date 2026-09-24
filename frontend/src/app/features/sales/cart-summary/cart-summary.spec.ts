import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { CartLine, CartSummary } from './cart-summary';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const lines: CartLine[] = [
    { productId: 'p1', productName: 'Water', quantity: 2, unitPrice: 100 },
    { productId: 'p2', productName: 'Chips', quantity: 3, unitPrice: 50 },
];

describe('CartSummary', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CartSummary],
            providers: [provideZonelessChangeDetection(), transloco()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(CartSummary);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('total computes the sum of quantity * unitPrice across all lines', () => {
        const fixture = TestBed.createComponent(CartSummary);
        fixture.componentRef.setInput('lines', lines);

        // 2*100 + 3*50 = 350
        expect(fixture.componentInstance.total()).toBe(350);
    });

    it('total is 0 when there are no lines', () => {
        const fixture = TestBed.createComponent(CartSummary);
        fixture.componentRef.setInput('lines', []);

        expect(fixture.componentInstance.total()).toBe(0);
    });

    it('emits removeLine with the productId when requested', () => {
        const fixture = TestBed.createComponent(CartSummary);
        fixture.componentRef.setInput('lines', lines);
        const emitted: string[] = [];
        fixture.componentInstance.removeLine.subscribe((id) => emitted.push(id));

        fixture.componentInstance.removeLine.emit('p1');

        expect(emitted).toEqual(['p1']);
    });

    it('emits checkout when requested', () => {
        const fixture = TestBed.createComponent(CartSummary);
        let checkedOut = false;
        fixture.componentInstance.checkout.subscribe(() => (checkedOut = true));

        fixture.componentInstance.checkout.emit();

        expect(checkedOut).toBe(true);
    });

    it('defaults isSubmitting to false', () => {
        const fixture = TestBed.createComponent(CartSummary);
        expect(fixture.componentInstance.isSubmitting()).toBe(false);
    });
});
