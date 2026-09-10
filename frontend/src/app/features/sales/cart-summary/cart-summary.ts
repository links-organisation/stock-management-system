import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface CartLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
})
export class CartSummary {
  @Input() lines: CartLine[] = [];
  @Input() isSubmitting = false;
  @Output() removeLine = new EventEmitter<number>();
  @Output() checkout = new EventEmitter<void>();

  get total(): number {
    return this.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }
}
