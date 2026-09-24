import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Category } from '../../../core/models/category.model';
import { Product } from '../../../core/models/product.model';
import { ProductFormData, ProductService } from '../../../core/services/product.service';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [ReactiveFormsModule, TranslocoPipe],
    templateUrl: './product-form.html',
    styleUrl: './product-form.scss',
})
export class ProductForm {
    product = input<Product | null>(null);
    categories = input<Category[]>([]);
    save = output<ProductFormData>();
    cancel = output<void>();

    isEditing = computed(() => this.product() !== null);

    private fb = inject(FormBuilder);
    form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        reference: ['', Validators.required],
        categoryId: this.fb.control<string | null>(null),
        purchasePrice: [0, [Validators.required, Validators.min(0)]],
        sellingPrice: [0, [Validators.required, Validators.min(0)]],
        quantityInStock: [0, [Validators.required, Validators.min(0)]],
        alertThreshold: [0, [Validators.required, Validators.min(0)]],
    });

    constructor(private productService: ProductService) {
        effect(() => {
            const product = this.product();
            this.form.reset(
                product
                    ? {
                          name: product.name,
                          reference: product.reference,
                          categoryId: product.categoryId,
                          purchasePrice: product.purchasePrice,
                          sellingPrice: product.sellingPrice,
                          quantityInStock: product.quantityInStock,
                          alertThreshold: product.alertThreshold,
                      }
                    : this.emptyModel(),
            );
        });
        this.form.get('categoryId')?.valueChanges?.subscribe({
            next: (value) => {
                if (this.product()?.categoryId === value)
                    this.form.patchValue({ reference: this.product()?.reference });
                else {
                    const cat = this.categories().find((c) => c.id === value);
                    if (cat?.prefix)
                        this.productService.getNextRef(cat?.prefix).subscribe({
                            next: (response) => {
                                this.form.patchValue({
                                    reference: response,
                                });
                            },
                            error: () => {
                                console.error();
                                this.form.patchValue({
                                    reference: '',
                                });
                            },
                        });
                }
            },
        });
        this.form.get('reference')?.valueChanges.subscribe({
            next: (reference) => {
                this.productService.checkRefAvailability(reference).subscribe({
                    next: (response) => {
                        if (!response.available) {
                            if (this.product()?.categoryId !== this.form.value.categoryId)
                                this.form.get('reference')?.setErrors({ notUnique: true });
                        } else {
                            const errors = this.form.get('reference')?.errors;
                            if (errors) {
                                delete errors['notUnique'];
                                if (Object.keys(errors).length === 0) {
                                    this.form.get('reference')?.setErrors(null);
                                }
                            }
                        }
                    },
                    error: () => {
                        if (this.product()?.categoryId !== this.form.value.categoryId)
                            this.form.get('reference')?.setErrors({ notUnique: true });
                    },
                });
            },
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.save.emit(this.form.getRawValue());
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
