import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { CategoryFormData, CategoryService } from '../../../core/services/category.service';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './category-list.html',
    styleUrl: './category-list.scss',
})
export class CategoryList {
    categories = signal<Category[]>([]);
    isLoading = signal(true);
    isSaving = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    private fb = inject(FormBuilder);
    form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        prefix: ['', Validators.required],
        description: [''],
    });

    constructor(private categoryService: CategoryService) {
        this.load();
    }

    load(): void {
        this.isLoading.set(true);
        this.categoryService.getAll().subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('Could not load categories.');
                this.isLoading.set(false);
            },
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const { name, prefix, description } = this.form.getRawValue();
        const data: CategoryFormData = { name, prefix, description: description || undefined };

        this.categoryService.create(data).subscribe({
            next: (category) => {
                this.isSaving.set(false);
                this.categories.update((list) =>
                    [...list, category].sort((a, b) => a.name.localeCompare(b.name)),
                );
                this.form.reset({ name: '', description: '' });
                this.successMessage.set(`"${category.name}" created.`);
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: (err) => {
                this.isSaving.set(false);
                this.errorMessage.set(
                    err.error?.message ??
                        'Could not create the category. Check the name is unique.',
                );
            },
        });
    }

    onDeleteCategory(category: Category): void {
        if (
            !confirm(
                `Delete "${category.name}"? Products in this category will become Uncategorized.`,
            )
        ) {
            return;
        }
        this.errorMessage.set('');
        this.categoryService.delete(category.id).subscribe({
            next: () => {
                this.categories.update((list) => list.filter((c) => c.id !== category.id));
                this.successMessage.set(`"${category.name}" deleted.`);
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: (err) => {
                this.errorMessage.set(err.error?.message ?? `Could not delete "${category.name}".`);
            },
        });
    }
}
