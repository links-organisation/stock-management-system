import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/models/product.model';
import { OperationType, StockOperation } from '../../core/models/stock-operation.model';
import { ProductService } from '../../core/services/product.service';
import { StockOperationService } from '../../core/services/stock-operation.service';

@Component({
  selector: 'app-stock-operation-history',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './stock-operation-history.html',
  styleUrl: './stock-operation-history.scss',
})
export class StockOperationHistory implements OnInit {
  operations: StockOperation[] = [];
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';

  typeFilter: OperationType | '' = '';
  productFilter: string | null = null;
  fromFilter = '';
  toFilter = '';

  constructor(
    private stockOperationService: StockOperationService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe((products) => {
      this.products = products;
      this.cdr.detectChanges();
    });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.stockOperationService
      .getAll({
        type: this.typeFilter || undefined,
        productId: this.productFilter,
        from: this.fromFilter || undefined,
        to: this.toFilter || undefined,
      })
      .subscribe({
        next: (operations) => {
          this.operations = operations;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Could not load the operations history.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
