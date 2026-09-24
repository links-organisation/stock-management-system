import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Role, User } from '../../../core/models/user.model';
import { roleLabelKey } from '../../../core/models/types';
import { ASSIGNABLE_ROLES, UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserForm, UserFormValue } from '../user-form/user-form';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [UserForm, TranslocoPipe],
    templateUrl: './user-list.html',
    styleUrl: './user-list.scss',
})
export class UserList {
    users = signal<User[]>([]);
    isLoading = signal(true);
    errorMessage = signal('');
    successMessage = signal('');

    isFormOpen = signal(false);
    editingUser = signal<User | null>(null);
    readonly roleLabelKey = roleLabelKey;

    private transloco = inject(TranslocoService);

    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) {
        this.load();
    }

    get currentRole(): Role | null {
        return this.authService.currentRole;
    }

    /** Roles the logged-in actor is allowed to assign, per the backend hierarchy. */
    get assignableRoles(): { value: Role; labelKey: string }[] {
        if (this.currentRole === 'SUPER_ADMIN') {
            return ASSIGNABLE_ROLES;
        }
        return ASSIGNABLE_ROLES.filter((r) => r.value === 'SELLER' || r.value === 'COMPTA');
    }

    load(): void {
        this.isLoading.set(true);
        this.userService.getAll().subscribe({
            next: (users) => {
                this.users.set(users);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set(this.transloco.translate('users.loadError'));
                this.isLoading.set(false);
            },
        });
    }

    /** Whether the logged-in actor is allowed to edit this row, per the hierarchy. */
    canManage(user: User): boolean {
        if (user.role === 'SUPER_ADMIN') {
            return false;
        }
        if (this.currentRole === 'SUPER_ADMIN') {
            return true;
        }
        if (this.currentRole === 'ADMIN') {
            return user.role === 'SELLER' || user.role === 'COMPTA';
        }
        return false;
    }

    openCreateForm(): void {
        this.editingUser.set(null);
        this.isFormOpen.set(true);
    }

    openEditForm(user: User): void {
        this.editingUser.set(user);
        this.isFormOpen.set(true);
    }

    closeForm(): void {
        this.isFormOpen.set(false);
        this.editingUser.set(null);
    }

    onSave(value: UserFormValue): void {
        this.errorMessage.set('');
        const editingUser = this.editingUser();
        const wasEditing = editingUser !== null;

        const request = editingUser
            ? this.userService.update(editingUser.id, value)
            : this.userService.create({ ...value, password: value.password ?? '' });

        request.subscribe({
            next: () => {
                this.closeForm();
                this.load();
                this.successMessage.set(this.transloco.translate(wasEditing ? 'users.updated' : 'users.registered'));
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: (err) => {
                this.errorMessage.set(err.error?.message ?? this.transloco.translate('users.saveError'));
            },
        });
    }
}
