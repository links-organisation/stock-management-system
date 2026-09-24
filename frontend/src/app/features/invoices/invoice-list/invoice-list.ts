import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Invoice } from '../../../core/models/invoice.model';
import { InvoiceService } from '../../../core/services/invoice.service';
import { InvoiceDetail } from '../invoice-detail/invoice-detail';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [DatePipe, InvoiceDetail, FcfaPipe, TranslocoPipe],
    templateUrl: './invoice-list.html',
    styleUrl: './invoice-list.scss',
})
export class InvoiceList {
    invoices = signal<Invoice[]>([]);
    selectedInvoice = signal<Invoice | null>(null);
    isLoading = signal(true);
    errorMessage = signal('');

    private transloco = inject(TranslocoService);

    constructor(private invoiceService: InvoiceService) {
        this.invoiceService.getAll().subscribe({
            next: (invoices) => {
                this.invoices.set(invoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set(this.transloco.translate('invoices.loadError'));
                this.isLoading.set(false);
            },
        });
    }

    selectInvoice(invoice: Invoice): void {
        this.invoiceService
            .getById(invoice.id)
            .subscribe((detail) => this.selectedInvoice.set(detail));
    }
}
