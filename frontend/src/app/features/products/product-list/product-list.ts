import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Product } from '../../../core/models/product.model';
import { CategoryService } from '../../../core/services/category.service';
import { ProductFormData, ProductService } from '../../../core/services/product.service';
import { ProductCard } from '../product-card/product-card';
import { ProductForm } from '../product-form/product-form';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, ProductCard, ProductForm],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  searchQuery = '';
  isLoading = true;
  errorMessage = '';

  isFormOpen = false;
  editingProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe((categories) => {
      this.categories = categories;
      this.cdr.detectChanges();
    });
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
        this.errorMessage = 'Could not load products.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.loadProducts();
      return;
    }
    this.productService.search(query).subscribe((products) => {
      this.products = products;
      this.cdr.detectChanges();
    });
  }

  openCreateForm(): void {
    this.editingProduct = null;
    this.isFormOpen = true;
    this.cdr.detectChanges();
  }

  openEditForm(product: Product): void {
    this.editingProduct = product;
    this.isFormOpen = true;
    this.cdr.detectChanges();
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.editingProduct = null;
    this.cdr.detectChanges();
  }

  onSaveProduct(data: ProductFormData): void {
    const request = this.editingProduct
      ? this.productService.update(this.editingProduct.id, data)
      : this.productService.create(data);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadProducts();
      },
      error: () => {
        this.errorMessage = 'Could not save the product. Check the reference is unique.';
        this.cdr.detectChanges();
      },
    });
  }

  onDeleteProduct(product: Product): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    this.productService.delete(product.id).subscribe(() => this.loadProducts());
  }
}
