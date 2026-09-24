import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { Invoice } from '../../../core/models/invoice.model';
import { InvoiceDetail } from './invoice-detail';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const invoice: Invoice = {
    id: 'inv1',
    invoiceNumber: 'INV-2026-000001',
    invoiceDate: '2026-01-01T10:00:00',
    saleId: 's1',
    totalAmount: 300,
    sale: {
        id: 's1',
        saleDate: '2026-01-01T10:00:00',
        totalAmount: 300,
        customerName: 'Walk-in',
        performedByUserId: 'u1',
        performedByUsername: 'seller',
        performedByFullname: 'Front Desk Seller',
        items: [{ id: 'si1', productId: 'p1', productName: 'Water', quantity: 2, unitPrice: 150, subtotal: 300 }],
    },
};

describe('InvoiceDetail', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvoiceDetail],
            providers: [provideZonelessChangeDetection(), transloco()],
        }).compileComponents();
    });

    it('should create with no invoice selected', () => {
        const fixture = TestBed.createComponent(InvoiceDetail);
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.invoice()).toBeNull();
    });

    it('shows an empty-state prompt when no invoice is selected', async () => {
        const fixture = TestBed.createComponent(InvoiceDetail);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.empty')).not.toBeNull();
    });

    it('renders invoice number, sale items, and total when an invoice is provided', async () => {
        const fixture = TestBed.createComponent(InvoiceDetail);
        fixture.componentRef.setInput('invoice', invoice);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('INV-2026-000001');
        expect(text).toContain('Water');
        expect(text).toContain('Front Desk Seller');
        expect(text).toContain('Walk-in');
        expect(fixture.nativeElement.querySelector('.empty')).toBeNull();
    });

    it('renders without a customer name when the sale has none', async () => {
        const noCustomer: Invoice = { ...invoice, sale: { ...invoice.sale!, customerName: null } };
        const fixture = TestBed.createComponent(InvoiceDetail);
        fixture.componentRef.setInput('invoice', noCustomer);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Walk-in');
    });
});
