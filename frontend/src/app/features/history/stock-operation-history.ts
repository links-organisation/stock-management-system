import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Product } from '../../core/models/product.model';
import { OperationType, StockOperation } from '../../core/models/stock-operation.model';
import { operationTypeLabelKey } from '../../core/models/types';
import { ProductService } from '../../core/services/product.service';
import { StockOperationService } from '../../core/services/stock-operation.service';

@Component({
    selector: 'app-stock-operation-history',
    standalone: true,
    imports: [ReactiveFormsModule, DatePipe, TranslocoPipe],
    templateUrl: './stock-operation-history.html',
    styleUrl: './stock-operation-history.scss',
})
export class StockOperationHistory {
    operations = signal<StockOperation[]>([]);
    products = signal<Product[]>([]);
    isLoading = signal(true);
    errorMessage = signal('');
    readonly operationTypeLabelKey = operationTypeLabelKey;

    private transloco = inject(TranslocoService);
    private fb = inject(FormBuilder);
    filterForm = this.fb.nonNullable.group({
        typeFilter: this.fb.nonNullable.control<OperationType | ''>(''),
        productFilter: this.fb.control<string | null>(null),
        fromFilter: [''],
        toFilter: [''],
    });

    constructor(
        private stockOperationService: StockOperationService,
        private productService: ProductService,
    ) {
        this.productService.getAll().subscribe((products) => this.products.set(products));
        this.load();

        this.filterForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load());
    }

    load(): void {
        const { typeFilter, productFilter, fromFilter, toFilter } = this.filterForm.getRawValue();
        this.isLoading.set(true);
        this.stockOperationService
            .getAll({
                type: typeFilter || undefined,
                productId: productFilter,
                from: fromFilter || undefined,
                to: toFilter || undefined,
            })
            .subscribe({
                next: (operations) => {
                    this.operations.set(operations);
                    this.isLoading.set(false);
                },
                error: () => {
                    this.errorMessage.set(this.transloco.translate('history.loadError'));
                    this.isLoading.set(false);
                },
            });
    }
}
