import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { Navbar } from './navbar';
import { AuthService } from '../../../core/services/auth.service';
import { SystemService } from '../../../core/services/system.service';
import { TranslocoHttpLoader } from '../../../core/i18n/transloco-loader';
import { User } from '../../../core/models/user.model';

describe('Navbar', () => {
    let authServiceMock: {
        currentUser: User | null;
        canSell: ReturnType<typeof vi.fn>;
        isAdminOrAbove: ReturnType<typeof vi.fn>;
        isSuperAdmin: ReturnType<typeof vi.fn>;
        logout: ReturnType<typeof vi.fn>;
    };
    let httpMock: HttpTestingController;

    function createFixture() {
        const fixture = TestBed.createComponent(Navbar);
        fixture.detectChanges();
        return fixture;
    }

    beforeEach(() => {
        localStorage.clear();
        authServiceMock = {
            currentUser: null,
            canSell: vi.fn().mockReturnValue(false),
            isAdminOrAbove: vi.fn().mockReturnValue(false),
            isSuperAdmin: vi.fn().mockReturnValue(false),
            logout: vi.fn(),
        };

        TestBed.configureTestingModule({
            imports: [Navbar],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideTransloco({
                    config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
                    loader: TranslocoHttpLoader,
                }),
                { provide: AuthService, useValue: authServiceMock },
            ],
        });
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    afterEach(() => {
        localStorage.clear();
    });

    it('creates', () => {
        const fixture = createFixture();
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('navItems includes only base links when actor cannot sell and is not admin', () => {
        const fixture = createFixture();
        const paths = fixture.componentInstance.navItems.map((i) => i.path);

        expect(paths).toEqual(['/dashboard', '/products', '/history', '/invoices']);
    });

    it('navItems includes /sales when actor canSell', () => {
        authServiceMock.canSell.mockReturnValue(true);
        const fixture = createFixture();

        expect(fixture.componentInstance.navItems.map((i) => i.path)).toContain('/sales');
    });

    it('navItems includes inventory/categories/users when actor isAdminOrAbove', () => {
        authServiceMock.isAdminOrAbove.mockReturnValue(true);
        const fixture = createFixture();
        const paths = fixture.componentInstance.navItems.map((i) => i.path);

        expect(paths).toContain('/inventory');
        expect(paths).toContain('/categories');
        expect(paths).toContain('/users');
        expect(paths).toContain('/network');
    });

    it('toggleSidebar flips isSidebarOpen and toggles the no-scroll body class', () => {
        const fixture = createFixture();
        expect(fixture.componentInstance.isSidebarOpen()).toBe(false);

        fixture.componentInstance.toggleSidebar();

        expect(fixture.componentInstance.isSidebarOpen()).toBe(true);
        expect(document.body.classList.contains('no-scroll')).toBe(true);

        fixture.componentInstance.closeSidebar();

        expect(fixture.componentInstance.isSidebarOpen()).toBe(false);
        expect(document.body.classList.contains('no-scroll')).toBe(false);
    });

    it('setLanguage updates the active language and persists it to localStorage', () => {
        const fixture = createFixture();

        fixture.componentInstance.setLanguage('fr');

        expect(fixture.componentInstance.activeLang()).toBe('fr');
        expect(localStorage.getItem('stock-management.lang')).toBe('fr');
    });

    it('logout closes the sidebar, logs out, and navigates to /login', () => {
        const fixture = createFixture();
        const router = TestBed.inject(Router);
        const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.componentInstance.toggleSidebar();

        fixture.componentInstance.logout();

        expect(fixture.componentInstance.isSidebarOpen()).toBe(false);
        expect(authServiceMock.logout).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('does not show the "Turn off" button for a non-Super-Admin', () => {
        authServiceMock.currentUser = { id: 'u1', username: 'admin', fullName: 'Store Admin', role: 'ADMIN' };
        authServiceMock.isSuperAdmin.mockReturnValue(false);
        const fixture = createFixture();

        expect(fixture.nativeElement.querySelector('.account__turn-off')).toBeNull();
    });

    it('shows the "Turn off" button for a Super Admin', () => {
        authServiceMock.currentUser = { id: 'u0', username: 'superadmin', fullName: 'Shop Administrator', role: 'SUPER_ADMIN' };
        authServiceMock.isSuperAdmin.mockReturnValue(true);
        const fixture = createFixture();

        expect(fixture.nativeElement.querySelectorAll('.account__turn-off').length).toBeGreaterThan(0);
    });

    it('turnOff does nothing when the user cancels the confirmation', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
        const fixture = createFixture();
        const systemService = TestBed.inject(SystemService);

        fixture.componentInstance.turnOff();

        httpMock.expectNone((r) => r.url.endsWith('/system/shutdown'));
        expect(systemService.isShutdown()).toBe(false);
        expect(closeSpy).not.toHaveBeenCalled();
    });

    it('turnOff calls the shutdown endpoint, sets isShutdown, and attempts window.close on success when confirmed', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
        const fixture = createFixture();
        const systemService = TestBed.inject(SystemService);

        fixture.componentInstance.turnOff();

        const req = httpMock.expectOne((r) => r.url.endsWith('/system/shutdown') && r.method === 'POST');
        req.flush(null);

        expect(systemService.isShutdown()).toBe(true);
        expect(closeSpy).toHaveBeenCalled();
    });

    it('turnOff still sets isShutdown and attempts window.close when the shutdown request errors', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
        const fixture = createFixture();
        const systemService = TestBed.inject(SystemService);

        fixture.componentInstance.turnOff();

        httpMock
            .expectOne((r) => r.url.endsWith('/system/shutdown'))
            .flush('boom', { status: 0, statusText: 'Unknown Error' });

        expect(systemService.isShutdown()).toBe(true);
        expect(closeSpy).toHaveBeenCalled();
    });
});
