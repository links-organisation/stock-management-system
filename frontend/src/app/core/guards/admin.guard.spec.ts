import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
    function setup(isAdminOrAbove: boolean) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: { isAdminOrAbove: () => isAdminOrAbove } },
            ],
        });
        return TestBed.inject(Router);
    }

    it('allows activation when the user is Admin or above', () => {
        const router = setup(true);
        const navigateSpy = vi.spyOn(router, 'navigate');

        const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

        expect(result).toBe(true);
        expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('redirects to /dashboard and blocks activation otherwise', () => {
        const router = setup(false);
        const navigateSpy = vi.spyOn(router, 'navigate');

        const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });
});
