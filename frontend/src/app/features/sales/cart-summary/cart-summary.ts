import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

export interface CartLine {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
}

@Component({
    selector: 'app-cart-summary',
    standalone: true,
    imports: [FcfaPipe],
    templateUrl: './cart-summary.html',
    styleUrl: './cart-summary.scss',
})
export class CartSummary {
    @Input() lines: CartLine[] = [];
    @Input() isSubmitting = false;
    @Output() removeLine = new EventEmitter<string>();
    @Output() checkout = new EventEmitter<void>();

    get total(): number {
        return this.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    }
}
