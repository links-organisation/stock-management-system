import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Role, User } from '../../../core/models/user.model';
import { ASSIGNABLE_ROLES, UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserForm, UserFormValue } from '../user-form/user-form';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserForm],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  users: User[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  isFormOpen = false;
  editingUser: User | null = null;

  constructor(private userService: UserService, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  get currentRole(): Role | null {
    return this.authService.currentRole;
  }

  /** Roles the logged-in actor is allowed to assign, per the backend hierarchy. */
  get assignableRoles(): { value: Role; label: string }[] {
    if (this.currentRole === 'SUPER_ADMIN') {
      return ASSIGNABLE_ROLES;
    }
    return ASSIGNABLE_ROLES.filter((r) => r.value === 'SELLER' || r.value === 'COMPTA');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Could not load users.';
        this.isLoading = false;
        this.cdr.detectChanges();
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
    this.editingUser = null;
    this.isFormOpen = true;
    this.cdr.detectChanges();
  }

  openEditForm(user: User): void {
    this.editingUser = user;
    this.isFormOpen = true;
    this.cdr.detectChanges();
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.editingUser = null;
    this.cdr.detectChanges();
  }

  onSave(value: UserFormValue): void {
    this.errorMessage = '';
    const wasEditing = this.editingUser !== null;

    const request = this.editingUser
      ? this.userService.update(this.editingUser.id, value)
      : this.userService.create({ ...value, password: value.password ?? '' });

    request.subscribe({
      next: () => {
        this.closeForm();
        this.load();
        this.successMessage = wasEditing ? 'User updated.' : 'User registered.';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Could not save the user.';
        this.cdr.detectChanges();
      },
    });
  }
}
