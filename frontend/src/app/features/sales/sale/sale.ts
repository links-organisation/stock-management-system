import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Product } from '../../../core/models/product.model';
import { SaleItemRequest } from '../../../core/models/sale.model';
import { ProductService } from '../../../core/services/product.service';
import { SaleService } from '../../../core/services/sale.service';
import { CartLine, CartSummary } from '../cart-summary/cart-summary';
import { ProductPick, ProductSelector } from '../product-selector/product-selector';

@Component({
    selector: 'app-sale',
    standalone: true,
    imports: [ReactiveFormsModule, ProductSelector, CartSummary, TranslocoPipe],
    templateUrl: './sale.html',
    styleUrl: './sale.scss',
})
export class Sale {
    products = signal<Product[]>([]);
    cart = signal<CartLine[]>([]);
    isSubmitting = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    customerName = new FormControl('', { nonNullable: true });

    private transloco = inject(TranslocoService);

    constructor(
        private productService: ProductService,
        private saleService: SaleService,
    ) {
        this.loadProducts();
    }

    loadProducts(): void {
        this.productService.getAll().subscribe((products) => this.products.set(products));
    }

    onAddToCart(pick: ProductPick): void {
        this.cart.update((cart) => {
            const existing = cart.find((line) => line.productId === pick.product.id);
            if (existing) {
                return cart.map((line) =>
                    line.productId === pick.product.id
                        ? { ...line, quantity: line.quantity + pick.quantity }
                        : line,
                );
            }
            return [
                ...cart,
                {
                    productId: pick.product.id,
                    productName: pick.product.name,
                    quantity: pick.quantity,
                    unitPrice: pick.product.sellingPrice,
                },
            ];
        });
    }

    onRemoveLine(productId: string): void {
        this.cart.update((cart) => cart.filter((line) => line.productId !== productId));
    }

    onCheckout(): void {
        const cart = this.cart();
        if (cart.length === 0) {
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const items: SaleItemRequest[] = cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
        }));

        this.saleService.createSale(items, this.customerName.value || undefined).subscribe({
            next: (sale) => {
                this.isSubmitting.set(false);
                this.successMessage.set(this.transloco.translate('sales.completed', { id: sale.id }));
                this.cart.set([]);
                this.customerName.setValue('');
                this.loadProducts();
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(err.error?.message ?? this.transloco.translate('sales.completeError'));
            },
        });
    }
}
