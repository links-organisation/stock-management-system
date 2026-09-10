import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnChanges {
  @Input() user: User | null = null;
  @Input() assignableRoles: { value: Role; label: string }[] = [];
  @Output() save = new EventEmitter<UserFormValue>();
  @Output() cancel = new EventEmitter<void>();

  model: UserFormValue = this.emptyModel();

  get isEditing(): boolean {
    return this.user !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.model = this.user
        ? { username: this.user.username, fullName: this.user.fullName, role: this.user.role, password: '' }
        : this.emptyModel();
    }
  }

  onSubmit(): void {
    const value: UserFormValue = { ...this.model };
    if (this.isEditing && !value.password) {
      delete value.password;
    }
    this.save.emit(value);
  }

  private emptyModel(): UserFormValue {
    return {
      username: '',
      password: '',
      fullName: '',
      role: this.assignableRoles[0]?.value ?? 'SELLER',
    };
  }
}
