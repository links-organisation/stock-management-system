import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InvoiceService } from './invoice.service';
import { Invoice } from '../models/invoice.model';

describe('InvoiceService', () => {
    let service: InvoiceService;
    let httpMock: HttpTestingController;

    const invoice: Invoice = {
        id: 'i1',
        invoiceNumber: 'INV-2026-000001',
        invoiceDate: '2026-01-01T00:00:00',
        saleId: 's1',
        totalAmount: 500,
        sale: null,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(InvoiceService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAll() issues a GET to the invoices base URL', () => {
        service.getAll().subscribe((res) => expect(res).toEqual([invoice]));
        const req = httpMock.expectOne((r) => r.url.endsWith('/invoices') && r.method === 'GET');
        req.flush([invoice]);
    });

    it('getById() issues a GET to /invoices/{id}', () => {
        service.getById('i1').subscribe((res) => expect(res).toEqual(invoice));
        const req = httpMock.expectOne((r) => r.url.endsWith('/invoices/i1') && r.method === 'GET');
        req.flush(invoice);
    });
});
