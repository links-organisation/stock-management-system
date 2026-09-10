import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../core/models/product.model';
import { SaleItemRequest } from '../../../core/models/sale.model';
import { ProductService } from '../../../core/services/product.service';
import { SaleService } from '../../../core/services/sale.service';
import { CartLine, CartSummary } from '../cart-summary/cart-summary';
import { ProductPick, ProductSelector } from '../product-selector/product-selector';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [FormsModule, ProductSelector, CartSummary],
  templateUrl: './sale.html',
  styleUrl: './sale.scss',
})
export class Sale implements OnInit {
  products: Product[] = [];
  cart: CartLine[] = [];
  customerName = '';
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private productService: ProductService, private saleService: SaleService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe((products) => {
      this.products = products;
      this.cdr.detectChanges();
    });
  }

  onAddToCart(pick: ProductPick): void {
    const existing = this.cart.find((line) => line.productId === pick.product.id);
    if (existing) {
      this.cart = this.cart.map((line) =>
        line.productId === pick.product.id ? { ...line, quantity: line.quantity + pick.quantity } : line
      );
    } else {
      this.cart = [
        ...this.cart,
        {
          productId: pick.product.id,
          productName: pick.product.name,
          quantity: pick.quantity,
          unitPrice: pick.product.sellingPrice,
        },
      ];
    }
    this.cdr.detectChanges();
  }

  onRemoveLine(productId: number): void {
    this.cart = this.cart.filter((line) => line.productId !== productId);
    this.cdr.detectChanges();
  }

  onCheckout(): void {
    if (this.cart.length === 0) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const items: SaleItemRequest[] = this.cart.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    }));

    this.saleService.createSale(items, this.customerName || undefined).subscribe({
      next: (sale) => {
        this.isSubmitting = false;
        this.successMessage = `Sale #${sale.id} completed.`;
        this.cart = [];
        this.customerName = '';
        this.loadProducts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message ?? 'Could not complete the sale.';
        this.cdr.detectChanges();
      },
    });
  }
}
