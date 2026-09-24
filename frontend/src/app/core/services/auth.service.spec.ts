import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

const STORAGE_KEY = 'stock-management.currentUser';

describe('AuthService', () => {
    let httpMock: HttpTestingController;

    const user: User = { id: 'u1', username: 'seller', fullName: 'Seller One', role: 'SELLER' };

    beforeEach(() => {
        sessionStorage.clear();
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        sessionStorage.clear();
    });

    it('starts with no current user when sessionStorage is empty', () => {
        const service = TestBed.inject(AuthService);
        expect(service.currentUser).toBeNull();
        expect(service.isLoggedIn()).toBe(false);
    });

    it('reads a previously stored user from sessionStorage on construction', () => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        const service = TestBed.inject(AuthService);
        expect(service.currentUser).toEqual(user);
        expect(service.isLoggedIn()).toBe(true);
    });

    it('falls back to no user when sessionStorage holds invalid JSON', () => {
        sessionStorage.setItem(STORAGE_KEY, '{not valid json');
        const service = TestBed.inject(AuthService);
        expect(service.currentUser).toBeNull();
    });

    it('login() posts credentials, stores the returned user, and updates currentUser$', () => {
        const service = TestBed.inject(AuthService);
        let emitted: User | null | undefined;
        service.currentUser$.subscribe((u) => (emitted = u));

        service.login({ username: 'seller', password: 'secret' }).subscribe();

        const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login') && r.method === 'POST');
        expect(req.request.body).toEqual({ username: 'seller', password: 'secret' });
        req.flush(user);

        expect(service.currentUser).toEqual(user);
        expect(emitted).toEqual(user);
        expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toEqual(user);
    });

    it('updateCurrentUser() replaces the current user and persists it', () => {
        const service = TestBed.inject(AuthService);
        const updated: User = { ...user, fullName: 'New Name' };

        service.updateCurrentUser(updated);

        expect(service.currentUser).toEqual(updated);
        expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toEqual(updated);
    });

    it('logout() clears the current user and sessionStorage', () => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        const service = TestBed.inject(AuthService);

        service.logout();

        expect(service.currentUser).toBeNull();
        expect(service.isLoggedIn()).toBe(false);
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('currentUserId reflects the current user id, or null when logged out', () => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        const service = TestBed.inject(AuthService);
        expect(service.currentUserId).toBe('u1');

        service.logout();
        expect(service.currentUserId).toBeNull();
    });

    describe('isAdminOrAbove', () => {
        it.each([
            ['SUPER_ADMIN', true],
            ['ADMIN', true],
            ['SELLER', false],
            ['COMPTA', false],
        ] as const)('returns %s -> %s', (role, expected) => {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...user, role }));
            const service = TestBed.inject(AuthService);
            expect(service.isAdminOrAbove()).toBe(expected);
        });

        it('returns false when no user is logged in', () => {
            const service = TestBed.inject(AuthService);
            expect(service.isAdminOrAbove()).toBe(false);
        });
    });

    describe('canSell', () => {
        it.each([
            ['SUPER_ADMIN', true],
            ['ADMIN', true],
            ['SELLER', true],
            ['COMPTA', false],
        ] as const)('returns %s -> %s', (role, expected) => {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...user, role }));
            const service = TestBed.inject(AuthService);
            expect(service.canSell()).toBe(expected);
        });
    });
});
