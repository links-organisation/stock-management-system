import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Invoice } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { InvoiceDetail } from '../invoice-detail/invoice-detail';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [DatePipe, InvoiceDetail, FcfaPipe],
    templateUrl: './invoice-list.html',
    styleUrl: './invoice-list.scss',
})
export class InvoiceList {
    invoices = signal<Invoice[]>([]);
    selectedInvoice = signal<Invoice | null>(null);
    isLoading = signal(true);
    errorMessage = signal('');

    constructor(private invoiceService: InvoiceService) {
        this.invoiceService.getAll().subscribe({
            next: (invoices) => {
                this.invoices.set(invoices);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Could not load invoices.');
                this.isLoading.set(false);
            },
        });
    }

    selectInvoice(invoice: Invoice): void {
        this.invoiceService.getById(invoice.id).subscribe((detail) => this.selectedInvoice.set(detail));
    }
}
