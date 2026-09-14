import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class InvoiceList implements OnInit {
    invoices: Invoice[] = [];
    selectedInvoice: Invoice | null = null;
    isLoading = true;
    errorMessage = '';

    constructor(
        private invoiceService: InvoiceService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.invoiceService.getAll().subscribe({
            next: (invoices) => {
                this.invoices = invoices;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.errorMessage = 'Could not load invoices.';
                this.isLoading = false;
                this.cdr.detectChanges();
            },
        });
    }

    selectInvoice(invoice: Invoice): void {
        this.invoiceService.getById(invoice.id).subscribe((detail) => {
            this.selectedInvoice = detail;
            this.cdr.detectChanges();
        });
    }
}
