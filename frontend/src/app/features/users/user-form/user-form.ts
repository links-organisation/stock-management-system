import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role, User } from '../../../core/models/user.model';

export interface UserFormValue {
    username: string;
    password?: string;
    fullName: string;
    role: Role;
}

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './user-form.html',
    styleUrl: './user-form.scss',
})
export class UserForm {
    user = input<User | null>(null);
    assignableRoles = input<{ value: Role; label: string }[]>([]);
    save = output<UserFormValue>();
    cancel = output<void>();

    isEditing = computed(() => this.user() !== null);

    private fb = inject(FormBuilder);
    form = this.fb.nonNullable.group({
        fullName: ['', Validators.required],
        username: ['', Validators.required],
        password: [''],
        role: this.fb.nonNullable.control<Role>('SELLER', Validators.required),
    });

    constructor() {
        effect(() => {
            const user = this.user();
            const editing = user !== null;

            this.form.controls.password.setValidators(editing ? [] : [Validators.required]);
            this.form.controls.password.updateValueAndValidity({ emitEvent: false });

            this.form.reset(
                user
                    ? { username: user.username, fullName: user.fullName, role: user.role, password: '' }
                    : this.emptyModel(),
            );
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const value: UserFormValue = { ...this.form.getRawValue() };
        if (this.isEditing() && !value.password) {
            delete value.password;
        }
        this.save.emit(value);
    }

    private emptyModel(): { username: string; fullName: string; password: string; role: Role } {
        return { username: '', fullName: '', password: '', role: this.assignableRoles()[0]?.value ?? 'SELLER' };
    }
}
