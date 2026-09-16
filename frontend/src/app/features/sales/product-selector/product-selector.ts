import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../../core/models/product.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa/fcfa-pipe';

export interface ProductPick {
    product: Product;
    quantity: number;
}

@Component({
    selector: 'app-product-selector',
    standalone: true,
    imports: [ReactiveFormsModule, FcfaPipe],
    templateUrl: './product-selector.html',
    styleUrl: './product-selector.scss',
})
export class ProductSelector {
    products = input<Product[]>([]);
    add = output<ProductPick>();

    private fb = inject(FormBuilder);
    form = this.fb.group({
        selectedProductId: this.fb.control<string | null>(null),
        quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    });

    private selectedProductId = toSignal(this.form.controls.selectedProductId.valueChanges, { initialValue: null });
    selectedProduct = computed(() => this.products().find((p) => p.id === this.selectedProductId()) ?? null);

    onAdd(): void {
        const product = this.selectedProduct();
        const quantity = this.form.controls.quantity.value;
        if (!product || quantity < 1) {
            return;
        }
        this.add.emit({ product, quantity });
        this.form.controls.quantity.setValue(1);
    }
}
