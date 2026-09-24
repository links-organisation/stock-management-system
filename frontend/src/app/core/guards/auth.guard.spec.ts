import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
    function setup(isLoggedIn: boolean) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: { isLoggedIn: () => isLoggedIn } },
            ],
        });
        return TestBed.inject(Router);
    }

    it('allows activation when the user is logged in', () => {
        const router = setup(true);
        const navigateSpy = vi.spyOn(router, 'navigate');

        const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

        expect(result).toBe(true);
        expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('redirects to /login and blocks activation when the user is not logged in', () => {
        const router = setup(false);
        const navigateSpy = vi.spyOn(router, 'navigate');

        const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
});
