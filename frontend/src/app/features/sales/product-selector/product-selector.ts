import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../core/models/product.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

export interface ProductPick {
    product: Product;
    quantity: number;
}

@Component({
    selector: 'app-product-selector',
    standalone: true,
    imports: [FormsModule, FcfaPipe],
    templateUrl: './product-selector.html',
    styleUrl: './product-selector.scss',
})
export class ProductSelector {
    @Input() products: Product[] = [];
    @Output() add = new EventEmitter<ProductPick>();

    selectedProductId: string | null = null;
    quantity = 1;

    get selectedProduct(): Product | null {
        return this.products.find((p) => p.id === this.selectedProductId) ?? null;
    }

    onAdd(): void {
        const product = this.selectedProduct;
        if (!product || this.quantity < 1) {
            return;
        }
        this.add.emit({ product, quantity: this.quantity });
        this.quantity = 1;
    }
}
