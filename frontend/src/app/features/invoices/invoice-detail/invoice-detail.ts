import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Invoice } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetail {
  @Input() invoice: Invoice | null = null;
}
