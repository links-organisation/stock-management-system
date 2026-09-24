import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Product } from '../../core/models/product.model';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { FcfaPipe } from '../../shared/pipes/fcfa/fcfa-pipe';
import { ArrowDown, ArrowUp, compare, sortData } from '../../shared/global.functions';
import {Sort} from "../../core/models/types";

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [ReactiveFormsModule, FcfaPipe, TranslocoPipe],
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

    ArrowUp = (outline: boolean = false) => ArrowUp(outline);
    ArrowDown = (outline: boolean = false) => ArrowDown(outline);

    protected sort = signal<Sort>({ active: 'name', direction: 'asc' });
    protected sortedProducts = computed(() => {
        const data = [...this.products()];
        const sortConfig = this.sort();

        if (!sortConfig.active || sortConfig.direction === '') {
            return data;
        }

        return data.sort((a, b) => {
            const isAsc = sortConfig.direction === 'asc';
            switch (sortConfig.active) {
                case 'name':
                    return compare(<string>a.name, <string>b.name, isAsc);
                case 'reference':
                    return compare(<string>a.reference, <string>b.reference, isAsc);
                case 'category':
                    return compare(<string>a.categoryName, <string>b.categoryName, isAsc);
                case 'unitValue':
                    return compare(<number>a.purchasePrice, <number>b.purchasePrice, isAsc);
                case 'stockValue':
                    return compare(
                        <number>(a.purchasePrice * a.quantityInStock),
                        <number>(b.purchasePrice * b.quantityInStock),
                        isAsc,
                    );
                case 'quantity':
                    return compare(<number>a.quantityInStock, <number>b.quantityInStock, isAsc);
                default:
                    return 0;
            }
        });
    });

    private transloco = inject(TranslocoService);
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
                this.errorMessage.set(this.transloco.translate('inventory.loadError'));
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
                this.products.update((list) =>
                    list.map((p) => (p.id === updated.id ? updated : p)),
                );
                this.successMessage.set(
                    this.transloco.translate('inventory.adjusted', {
                        name: updated.name,
                        quantity: updated.quantityInStock,
                    }),
                );
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: () => {
                this.isSaving.set(false);
                this.errorMessage.set(this.transloco.translate('inventory.adjustError'));
            },
        });
    }

    protected sortData(sort: { active: string; direction?: 'asc' | 'desc' }) {
        if (this.sort().active != sort.active)
            this.sort.set({ active: sort.active, direction: 'asc' });
        else {
            this.sort.update((s) => ({
                active: s.active,
                direction: s.direction === 'asc' ? 'desc' : 'asc',
            }));
        }
    }

    /*protected sortData = (s: { active: string; direction?: 'asc' | 'desc' }) => {
        const o_sort = this.sort();
        this.sort.update((o_s) => sortData(o_s, s.active));
    };*/
}
