import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Product } from '../../../core/models/product.model';
import { ProductFormData, ProductService } from '../../../core/services/product.service';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [ReactiveFormsModule],
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
                const cat = this.categories().find((c) => c.id === value);
                let nextRef = signal<string | undefined>(undefined);
                if (cat?.prefix)
                    this.productService.getNextRef(cat?.prefix).subscribe({
                        next: (response) => {
                            console.log('next pref: ' + response);
                            this.form.patchValue({
                                reference: response.prefix,
                            });
                        },
                        error: (response) =>{
                            console.error('next pref: ' + JSON.stringify(response));
                            this.form.patchValue({
                                reference: '',
                            })}
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
