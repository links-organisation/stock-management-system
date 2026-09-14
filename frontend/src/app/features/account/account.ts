import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { formatedRole } from '../../core/models/types';

@Component({
    selector: 'app-account',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './account.html',
    styleUrl: './account.scss',
})
export class Account {
    username: string;
    fullName: string;
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';

    isSaving = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private cdr: ChangeDetectorRef,
    ) {
        this.username = authService.currentUser?.username ?? '';
        this.fullName = authService.currentUser?.fullName ?? '';
    }

    get role() {
        return formatedRole[this.authService.currentRole ?? 'SELLER'];
    }

    onSubmit(): void {
        if (this.newPassword && this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'New password and confirmation do not match.';
            return;
        }

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.userService
            .updateSelf({
                username: this.username || undefined,
                fullName: this.fullName || undefined,
                currentPassword: this.currentPassword || undefined,
                newPassword: this.newPassword || undefined,
            })
            .subscribe({
                next: (user) => {
                    this.isSaving = false;
                    this.authService.updateCurrentUser(user);
                    this.currentPassword = '';
                    this.newPassword = '';
                    this.confirmPassword = '';
                    this.successMessage = 'Account updated.';
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.isSaving = false;
                    this.errorMessage = err.error?.message ?? 'Could not update your account.';
                    this.cdr.detectChanges();
                },
            });
    }
}
