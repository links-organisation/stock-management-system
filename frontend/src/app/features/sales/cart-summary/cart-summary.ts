import { Component, computed, input, output } from '@angular/core';
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
    lines = input<CartLine[]>([]);
    isSubmitting = input(false);
    removeLine = output<string>();
    checkout = output<void>();

    total = computed(() => this.lines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
}
