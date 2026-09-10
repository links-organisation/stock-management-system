import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  onSubmit(): void {
    if (!this.username || !this.password) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.status === 401
          ? 'Invalid username or password.'
          : 'Unable to reach the server. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }
}
