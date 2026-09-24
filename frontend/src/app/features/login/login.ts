import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, TranslocoPipe],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login {
    errorMessage = signal('');
    isSubmitting = signal(false);

    private fb = inject(FormBuilder);
    private transloco = inject(TranslocoService);
    form = this.fb.nonNullable.group({
        username: ['', Validators.required],
        password: ['', Validators.required],
    });

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');

        this.authService.login(this.form.getRawValue()).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(
                    this.transloco.translate(
                        err.status === 401 ? 'login.invalidCredentials' : 'login.serverError',
                    ),
                );
            },
        });
    }
}
