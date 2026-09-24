import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { sellGuard } from './sell.guard';
import { AuthService } from '../services/auth.service';

describe('sellGuard', () => {
    function setup(canSell: boolean) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: { canSell: () => canSell } },
            ],
        });
        return TestBed.inject(Router);
    }

    it('allows activation when the user can sell', () => {
        const router = setup(true);
        const navigateSpy = vi.spyOn(router, 'navigate');

        const result = TestBed.runInInjectionContext(() => sellGuard({} as never, {} as never));

        expect(result).toBe(true);
        expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('redirects to /dashboard and blocks activation when the user cannot sell (e.g. Compta)', () => {
        const router = setup(false);
        const navigateSpy = vi.spyOn(router, 'navigate');

        const result = TestBed.runInInjectionContext(() => sellGuard({} as never, {} as never));

        expect(result).toBe(false);
        expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });
});
