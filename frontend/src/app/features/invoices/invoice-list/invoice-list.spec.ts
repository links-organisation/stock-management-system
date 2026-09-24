import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { Invoice } from '../../../core/models/invoice.model';
import { InvoiceList } from './invoice-list';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const older: Invoice = {
    id: 'inv1',
    invoiceNumber: 'INV-2026-000001',
    invoiceDate: '2026-01-01T10:00:00',
    saleId: 's1',
    totalAmount: 100,
    sale: null,
};

const newer: Invoice = {
    id: 'inv2',
    invoiceNumber: 'INV-2026-000002',
    invoiceDate: '2026-02-01T10:00:00',
    saleId: 's2',
    totalAmount: 200,
    sale: null,
};

describe('InvoiceList', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvoiceList],
            providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), transloco()],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should create and load invoices, sorted most-recent first', () => {
        const fixture = TestBed.createComponent(InvoiceList);
        httpMock.expectOne((r) => r.url.endsWith('/invoices') && r.method === 'GET').flush([older, newer]);

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.invoices().map((i) => i.id)).toEqual(['inv2', 'inv1']);
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('sets an error message when loading fails', () => {
        const fixture = TestBed.createComponent(InvoiceList);
        httpMock
            .expectOne((r) => r.url.endsWith('/invoices'))
            .flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('selectInvoice fetches the invoice detail and stores it as selected', () => {
        const fixture = TestBed.createComponent(InvoiceList);
        httpMock.expectOne((r) => r.url.endsWith('/invoices')).flush([older]);

        fixture.componentInstance.selectInvoice(older);

        const req = httpMock.expectOne((r) => r.url.endsWith('/invoices/inv1') && r.method === 'GET');
        req.flush(older);

        expect(fixture.componentInstance.selectedInvoice()).toEqual(older);
    });

    it('starts with no invoice selected', () => {
        const fixture = TestBed.createComponent(InvoiceList);
        httpMock.expectOne((r) => r.url.endsWith('/invoices')).flush([]);

        expect(fixture.componentInstance.selectedInvoice()).toBeNull();
    });
});
