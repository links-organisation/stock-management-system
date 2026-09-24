import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../core/i18n/transloco-loader';
import { Login } from './login';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

describe('Login', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        sessionStorage.clear();
        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                transloco(),
            ],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        sessionStorage.clear();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(Login);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('does not submit when the form is invalid', () => {
        const fixture = TestBed.createComponent(Login);

        fixture.componentInstance.onSubmit();

        httpMock.expectNone((r) => r.url.endsWith('/auth/login'));
        expect(fixture.componentInstance.form.get('username')?.touched).toBe(true);
        expect(fixture.componentInstance.form.get('password')?.touched).toBe(true);
    });

    it('navigates to /dashboard and stops submitting on successful login', () => {
        const fixture = TestBed.createComponent(Login);
        const router = TestBed.inject(Router);
        const navigateSpy = vi.spyOn(router, 'navigate');
        fixture.componentInstance.form.setValue({ username: 'admin', password: 'admin123' });

        fixture.componentInstance.onSubmit();

        expect(fixture.componentInstance.isSubmitting()).toBe(true);
        const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login') && r.method === 'POST');
        expect(req.request.body).toEqual({ username: 'admin', password: 'admin123' });
        req.flush({ id: 'u1', username: 'admin', fullName: 'Admin', role: 'ADMIN' });

        expect(fixture.componentInstance.isSubmitting()).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('shows an invalid-credentials message on a 401 response', () => {
        const fixture = TestBed.createComponent(Login);
        fixture.componentInstance.form.setValue({ username: 'admin', password: 'wrong' });

        fixture.componentInstance.onSubmit();

        httpMock
            .expectOne((r) => r.url.endsWith('/auth/login'))
            .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isSubmitting()).toBe(false);
    });

    it('shows a generic server-error message on a non-401 failure', () => {
        const fixture = TestBed.createComponent(Login);
        fixture.componentInstance.form.setValue({ username: 'admin', password: 'admin123' });

        fixture.componentInstance.onSubmit();

        httpMock
            .expectOne((r) => r.url.endsWith('/auth/login'))
            .flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
    });
});
