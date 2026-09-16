import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { CategoryService } from '../../../core/services/category.service';
import { ProductFormData, ProductService } from '../../../core/services/product.service';
import { ProductCard } from '../product-card/product-card';
import { ProductForm } from '../product-form/product-form';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [ReactiveFormsModule, ProductCard, ProductForm],
    templateUrl: './product-list.html',
    styleUrl: './product-list.scss',
})
export class ProductList {
    products = signal<Product[]>([]);
    categories = signal<Category[]>([]);
    isLoading = signal(true);
    errorMessage = signal('');
    successMessage = signal('');

    isFormOpen = signal(false);
    editingProduct = signal<Product | null>(null);

    private fb = inject(FormBuilder);
    filterForm = this.fb.nonNullable.group({
        searchQuery: [''],
        categoryFilter: this.fb.control<string | null>(null),
    });

    constructor(
        private productService: ProductService,
        private categoryService: CategoryService,
        public authService: AuthService,
    ) {
        this.categoryService.getAll().subscribe((categories) => this.categories.set(categories));
        this.loadProducts();

        this.filterForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.applyFilters());
    }

    loadProducts(): void {
        this.isLoading.set(true);
        this.productService.getAll().subscribe({
            next: (products) => {
                this.products.set(products);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Could not load products.');
                this.isLoading.set(false);
            },
        });
    }

    applyFilters(): void {
        const { searchQuery, categoryFilter } = this.filterForm.getRawValue();
        const query = (searchQuery ?? '').trim();
        if (!query && categoryFilter == null) {
            this.loadProducts();
            return;
        }
        this.productService.search(query, categoryFilter).subscribe((products) => this.products.set(products));
    }

    openCreateForm(): void {
        this.editingProduct.set(null);
        this.isFormOpen.set(true);
    }

    openEditForm(product: Product): void {
        this.editingProduct.set(product);
        this.isFormOpen.set(true);
    }

    closeForm(): void {
        this.isFormOpen.set(false);
        this.editingProduct.set(null);
    }

    onSaveProduct(data: ProductFormData): void {
        const editingProduct = this.editingProduct();
        const wasEditing = editingProduct !== null;
        const request = editingProduct
            ? this.productService.update(editingProduct.id, data)
            : this.productService.create(data);

        request.subscribe({
            next: () => {
                this.closeForm();
                this.applyFilters();
                this.successMessage.set(wasEditing ? 'Product updated.' : 'Product registered.');
                this.clearSuccessMessageSoon();
            },
            error: () => {
                this.errorMessage.set('Could not save the product. Check the reference is unique.');
            },
        });
    }

    onDeleteProduct(product: Product): void {
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
            return;
        }
        this.errorMessage.set('');
        this.productService.delete(product.id).subscribe({
            next: () => {
                this.applyFilters();
                this.successMessage.set(`"${product.name}" deleted.`);
                this.clearSuccessMessageSoon();
            },
            error: (err) => {
                this.errorMessage.set(err.error?.message ?? `Could not delete "${product.name}".`);
            },
        });
    }

    private clearSuccessMessageSoon(): void {
        setTimeout(() => this.successMessage.set(''), 3000);
    }
}
