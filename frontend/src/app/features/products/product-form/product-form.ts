import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Product } from '../../../core/models/product.model';
import { ProductFormData } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnChanges {
  @Input() product: Product | null = null;
  @Input() categories: Category[] = [];
  @Output() save = new EventEmitter<ProductFormData>();
  @Output() cancel = new EventEmitter<void>();

  model: ProductFormData = this.emptyModel();

  get isEditing(): boolean {
    return this.product !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) {
      this.model = this.product
        ? {
            name: this.product.name,
            reference: this.product.reference,
            categoryId: this.product.categoryId,
            purchasePrice: this.product.purchasePrice,
            sellingPrice: this.product.sellingPrice,
            quantityInStock: this.product.quantityInStock,
            alertThreshold: this.product.alertThreshold,
          }
        : this.emptyModel();
    }
  }

  onSubmit(): void {
    this.save.emit(this.model);
  }

  private emptyModel(): ProductFormData {
    return {
      name: '',
      reference: '',
      categoryId: null,
      purchasePrice: 0,
      sellingPrice: 0,
      quantityInStock: 0,
      alertThreshold: 0,
    };
  }
}
