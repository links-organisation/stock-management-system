import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { formatedRole } from '../../core/models/types';

function passwordsMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const newPassword = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        if (!newPassword) {
            return null;
        }
        return newPassword === confirmPassword ? null : { passwordMismatch: true };
    };
}

@Component({
    selector: 'app-account',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './account.html',
    styleUrl: './account.scss',
})
export class Account {
    private authService = inject(AuthService);
    private userService = inject(UserService);

    isSaving = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    private fb = inject(FormBuilder);
    form = this.fb.nonNullable.group(
        {
            fullName: [this.authService.currentUser?.fullName ?? '', Validators.required],
            username: [this.authService.currentUser?.username ?? '', Validators.required],
            currentPassword: [''],
            newPassword: [''],
            confirmPassword: [''],
        },
        { validators: passwordsMatchValidator() },
    );

    get role() {
        return formatedRole[this.authService.currentRole ?? 'SELLER'];
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSaving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const { fullName, username, currentPassword, newPassword } = this.form.getRawValue();

        this.userService
            .updateSelf({
                username: username || undefined,
                fullName: fullName || undefined,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined,
            })
            .subscribe({
                next: (user) => {
                    this.isSaving.set(false);
                    this.authService.updateCurrentUser(user);
                    this.form.patchValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    this.successMessage.set('Account updated.');
                },
                error: (err) => {
                    this.isSaving.set(false);
                    this.errorMessage.set(err.error?.message ?? 'Could not update your account.');
                },
            });
    }
}
