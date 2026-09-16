import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../core/models/product.model';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { FcfaPipe } from '../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [ReactiveFormsModule, FcfaPipe],
    templateUrl: './inventory.html',
    styleUrl: './inventory.scss',
})
export class Inventory {
    products = signal<Product[]>([]);
    isLoading = signal(true);
    errorMessage = signal('');
    successMessage = signal('');

    adjustingProductId = signal<string | null>(null);
    isSaving = signal(false);

    private fb = inject(FormBuilder);
    adjustForm = this.fb.nonNullable.group({
        newQuantity: [0, [Validators.required, Validators.min(0)]],
        comment: [''],
    });

    constructor(
        private productService: ProductService,
        private inventoryService: InventoryService,
    ) {
        this.loadProducts();
    }

    loadProducts(): void {
        this.isLoading.set(true);
        this.productService.getAll().subscribe({
            next: (products) => {
                this.products.set(products);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Could not load inventory.');
                this.isLoading.set(false);
            },
        });
    }

    startAdjust(product: Product): void {
        this.adjustingProductId.set(product.id);
        this.adjustForm.reset({ newQuantity: product.quantityInStock, comment: '' });
    }

    cancelAdjust(): void {
        this.adjustingProductId.set(null);
    }

    saveAdjust(product: Product): void {
        if (this.adjustForm.invalid) {
            this.adjustForm.markAllAsTouched();
            return;
        }

        const { newQuantity, comment } = this.adjustForm.getRawValue();
        this.isSaving.set(true);
        this.inventoryService.adjust(product.id, newQuantity, comment || undefined).subscribe({
            next: (updated) => {
                this.isSaving.set(false);
                this.adjustingProductId.set(null);
                this.products.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
                this.successMessage.set(`${updated.name} adjusted to ${updated.quantityInStock}.`);
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: () => {
                this.isSaving.set(false);
                this.errorMessage.set('Could not save the adjustment.');
            },
        });
    }
}
