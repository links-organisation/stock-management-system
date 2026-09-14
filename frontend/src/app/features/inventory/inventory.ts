import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/models/product.model';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import { FcfaPipe } from '../../shared/pipes/fcfa/fcfa-pipe';

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [FormsModule, FcfaPipe],
    templateUrl: './inventory.html',
    styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
    products: Product[] = [];
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    adjustingProductId: string | null = null;
    newQuantity = 0;
    comment = '';
    isSaving = false;

    constructor(
        private productService: ProductService,
        private inventoryService: InventoryService,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.isLoading = true;
        this.productService.getAll().subscribe({
            next: (products) => {
                this.products = products;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.errorMessage = 'Could not load inventory.';
                this.isLoading = false;
                this.cdr.detectChanges();
            },
        });
    }

    startAdjust(product: Product): void {
        this.adjustingProductId = product.id;
        this.newQuantity = product.quantityInStock;
        this.comment = '';
        this.cdr.detectChanges();
    }

    cancelAdjust(): void {
        this.adjustingProductId = null;
        this.cdr.detectChanges();
    }

    saveAdjust(product: Product): void {
        this.isSaving = true;
        this.inventoryService
            .adjust(product.id, this.newQuantity, this.comment || undefined)
            .subscribe({
                next: (updated) => {
                    this.isSaving = false;
                    this.adjustingProductId = null;
                    this.products = this.products.map((p) => (p.id === updated.id ? updated : p));
                    this.successMessage = `${updated.name} adjusted to ${updated.quantityInStock}.`;
                    this.cdr.detectChanges();
                    setTimeout(() => {
                        this.successMessage = '';
                        this.cdr.detectChanges();
                    }, 3000);
                },
                error: () => {
                    this.isSaving = false;
                    this.errorMessage = 'Could not save the adjustment.';
                    this.cdr.detectChanges();
                },
            });
    }
}
