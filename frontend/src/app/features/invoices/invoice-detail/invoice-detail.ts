import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Invoice } from '../../../core/models/invoice.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-invoice-detail',
    standalone: true,
    imports: [DatePipe, FcfaPipe],
    templateUrl: './invoice-detail.html',
    styleUrl: './invoice-detail.scss',
})
export class InvoiceDetail {
    @Input() invoice: Invoice | null = null;
}
