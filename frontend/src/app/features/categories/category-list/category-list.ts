import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Category } from '../../../core/models/category.model';
import { CategoryFormData, CategoryService } from '../../../core/services/category.service';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [ReactiveFormsModule, TranslocoPipe],
    templateUrl: './category-list.html',
    styleUrl: './category-list.scss',
})
export class CategoryList {
    categories = signal<Category[]>([]);
    isLoading = signal(true);
    isSaving = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    editingCategory = signal<Category | null>(null);

    private transloco = inject(TranslocoService);
    private fb = inject(FormBuilder);
    form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        prefix: ['', Validators.required],
        description: [''],
    });

    constructor(private categoryService: CategoryService) {
        this.load();
        this.form.get('name')?.valueChanges.subscribe({
            next: (name) => {
                const currentName = name?.trim() ?? '';
                const editing = this.editingCategory();
                if (!currentName || (editing && editing.name.toLowerCase() === currentName.toLowerCase())) {
                    const errors = this.form.get('name')?.errors;
                    if (errors) {
                        delete errors['notUnique'];
                        if (Object.keys(errors).length === 0) {
                            this.form.get('name')?.setErrors(null);
                        }
                    }
                    return;
                }
                this.categoryService.checkAvailability('name', currentName).subscribe({
                    next: (response) => {
                        const currentEditing = this.editingCategory();
                        if (!response.available) {
                            if (!currentEditing || currentEditing.name.toLowerCase() !== currentName.toLowerCase()) {
                                this.form.get('name')?.setErrors({ notUnique: true });
                            }
                        } else {
                            const errors = this.form.get('name')?.errors;
                            if (errors) {
                                delete errors['notUnique'];
                                if (Object.keys(errors).length === 0) {
                                    this.form.get('name')?.setErrors(null);
                                }
                            }
                        }
                    },
                    error: () => {
                        const currentEditing = this.editingCategory();
                        if (!currentEditing || currentEditing.name.toLowerCase() !== currentName.toLowerCase()) {
                            this.form.get('name')?.setErrors({ notUnique: true });
                        }
                    },
                });
            },
        });
        this.form.get('prefix')?.valueChanges.subscribe({
            next: (prefix) => {
                const currentPrefix = prefix?.trim() ?? '';
                const editing = this.editingCategory();
                if (!currentPrefix || (editing && editing.prefix.toLowerCase() === currentPrefix.toLowerCase())) {
                    const errors = this.form.get('prefix')?.errors;
                    if (errors) {
                        delete errors['notUnique'];
                        if (Object.keys(errors).length === 0) {
                            this.form.get('prefix')?.setErrors(null);
                        }
                    }
                    return;
                }
                this.categoryService.checkAvailability('prefix', currentPrefix).subscribe({
                    next: (response) => {
                        const currentEditing = this.editingCategory();
                        if (!response.available) {
                            if (!currentEditing || currentEditing.prefix.toLowerCase() !== currentPrefix.toLowerCase()) {
                                this.form.get('prefix')?.setErrors({ notUnique: true });
                            }
                        } else {
                            const errors = this.form.get('prefix')?.errors;
                            if (errors) {
                                delete errors['notUnique'];
                                if (Object.keys(errors).length === 0) {
                                    this.form.get('prefix')?.setErrors(null);
                                }
                            }
                        }
                    },
                    error: () => {
                        const currentEditing = this.editingCategory();
                        if (!currentEditing || currentEditing.prefix.toLowerCase() !== currentPrefix.toLowerCase()) {
                            this.form.get('prefix')?.setErrors({ notUnique: true });
                        }
                    },
                });
            },
        });
    }

    load(): void {
        this.isLoading.set(true);
        this.categoryService.getAll().subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set(this.transloco.translate('categories.loadError'));
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

        const editing = this.editingCategory();
        if (editing) {
            this.categoryService.update(editing.id, data).subscribe({
                next: (category) => {
                    this.isSaving.set(false);
                    this.editingCategory.set(null);
                    this.categories.update((list) =>
                        list.map((c) => (c.id === category.id ? category : c)).sort((a, b) => a.name.localeCompare(b.name)),
                    );
                    this.form.reset({ name: '', prefix: '', description: '' });
                    this.successMessage.set(
                        this.transloco.translate('categories.updated', { name: category.name }),
                    );
                    setTimeout(() => this.successMessage.set(''), 3000);
                },
                error: (err) => {
                    this.isSaving.set(false);
                    this.errorMessage.set(
                        err.error?.message ?? this.transloco.translate('categories.updateError'),
                    );
                },
            });
        } else {
            this.categoryService.create(data).subscribe({
                next: (category) => {
                    this.isSaving.set(false);
                    this.categories.update((list) =>
                        [...list, category].sort((a, b) => a.name.localeCompare(b.name)),
                    );
                    this.form.reset({ name: '', prefix: '', description: '' });
                    this.successMessage.set(
                        this.transloco.translate('categories.created', { name: category.name }),
                    );
                    setTimeout(() => this.successMessage.set(''), 3000);
                },
                error: (err) => {
                    this.isSaving.set(false);
                    this.errorMessage.set(
                        err.error?.message ?? this.transloco.translate('categories.createError'),
                    );
                },
            });
        }
    }

    onEdit(category: Category): void {
        this.editingCategory.set(category);
        this.errorMessage.set('');
        this.form.reset({
            name: category.name,
            prefix: category.prefix,
            description: category.description ?? '',
        });
    }

    cancelEdit(): void {
        this.editingCategory.set(null);
        this.form.reset({ name: '', prefix: '', description: '' });
        this.errorMessage.set('');
    }

    onDeleteCategory(category: Category): void {
        if (
            !confirm(this.transloco.translate('categories.confirmDelete', { name: category.name }))
        ) {
            return;
        }
        this.errorMessage.set('');
        this.categoryService.delete(category.id).subscribe({
            next: () => {
                this.categories.update((list) => list.filter((c) => c.id !== category.id));
                if (this.editingCategory()?.id === category.id) {
                    this.cancelEdit();
                }
                this.successMessage.set(
                    this.transloco.translate('categories.deleted', { name: category.name }),
                );
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: (err) => {
                this.errorMessage.set(
                    err.error?.message ??
                        this.transloco.translate('categories.deleteError', { name: category.name }),
                );
            },
        });
    }
}
