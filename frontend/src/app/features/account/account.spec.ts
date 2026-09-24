import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../core/i18n/transloco-loader';
import { AuthService } from '../../core/services/auth.service';
import { Account } from './account';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

describe('Account', () => {
    let httpMock: HttpTestingController;
    let authServiceStub: {
        currentUser: { id: string; fullName: string; username: string; role: string } | null;
        currentUserId: string | null;
        currentRole: string | null;
        updateCurrentUser: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        authServiceStub = {
            currentUser: { id: 'u1', fullName: 'Shop Admin', username: 'admin', role: 'ADMIN' },
            currentUserId: 'u1',
            currentRole: 'ADMIN',
            updateCurrentUser: vi.fn(),
        };
        await TestBed.configureTestingModule({
            imports: [Account],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                transloco(),
                { provide: AuthService, useValue: authServiceStub },
            ],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should create and pre-fill the form from the current user', () => {
        const fixture = TestBed.createComponent(Account);

        expect(fixture.componentInstance).toBeTruthy();
        expect(fixture.componentInstance.form.value.fullName).toBe('Shop Admin');
        expect(fixture.componentInstance.form.value.username).toBe('admin');
    });

    it('exposes the translated role label for the current role', () => {
        const fixture = TestBed.createComponent(Account);

        expect(fixture.componentInstance.role).toBeTruthy();
    });

    it('flags passwordMismatch when new and confirm passwords differ', () => {
        const fixture = TestBed.createComponent(Account);
        fixture.componentInstance.form.patchValue({ newPassword: 'abc123', confirmPassword: 'xyz789' });

        expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBe(true);
    });

    it('does not flag passwordMismatch when newPassword is blank', () => {
        const fixture = TestBed.createComponent(Account);
        fixture.componentInstance.form.patchValue({ newPassword: '', confirmPassword: 'xyz789' });

        expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBe(false);
    });

    it('does not submit an invalid form', () => {
        const fixture = TestBed.createComponent(Account);
        fixture.componentInstance.form.patchValue({ fullName: '' });

        fixture.componentInstance.onSubmit();

        httpMock.expectNone((r) => r.url.endsWith('/users/me'));
    });

    it('submits the profile update and refreshes the stored session on success', () => {
        const fixture = TestBed.createComponent(Account);

        fixture.componentInstance.onSubmit();

        const req = httpMock.expectOne((r) => r.url.endsWith('/users/me') && r.method === 'PUT');
        expect(req.request.body).toEqual({
            username: 'admin',
            fullName: 'Shop Admin',
            currentPassword: undefined,
            newPassword: undefined,
            userId: 'u1',
        });
        const updatedUser = { id: 'u1', fullName: 'Shop Admin', username: 'admin', role: 'ADMIN' };
        req.flush(updatedUser);

        expect(authServiceStub.updateCurrentUser).toHaveBeenCalledWith(updatedUser);
        expect(fixture.componentInstance.successMessage()).not.toBe('');
        expect(fixture.componentInstance.isSaving()).toBe(false);
    });

    it('shows an error message when the update fails', () => {
        const fixture = TestBed.createComponent(Account);

        fixture.componentInstance.onSubmit();

        httpMock
            .expectOne((r) => r.url.endsWith('/users/me'))
            .flush('boom', { status: 500, statusText: 'Server Error' });

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isSaving()).toBe(false);
    });
});
