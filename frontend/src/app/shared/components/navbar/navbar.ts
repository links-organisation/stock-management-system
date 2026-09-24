import { DOCUMENT } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { SystemService } from '../../../core/services/system.service';
import { AppLanguage, storeLanguage } from '../../../core/i18n/language';

interface NavItem {
    path: string;
    labelKey: string;
}

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, TranslocoPipe],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    isSidebarOpen = signal(false);

    private transloco = inject(TranslocoService);
    readonly activeLang = this.transloco.activeLang;

    constructor(
        public authService: AuthService,
        private systemService: SystemService,
        private router: Router,
        @Inject(DOCUMENT) private document: Document,
    ) {}

    get navItems(): NavItem[] {
        const items: NavItem[] = [
            { path: '/dashboard', labelKey: 'nav.dashboard' },
            { path: '/products', labelKey: 'nav.products' },
        ];
        if (this.authService.canSell()) {
            items.push({ path: '/sales', labelKey: 'nav.sell' });
        }
        if (this.authService.isAdminOrAbove()) {
            items.push({ path: '/inventory', labelKey: 'nav.inventory' });
            items.push({ path: '/categories', labelKey: 'nav.categories' });
            items.push({ path: '/network', labelKey: 'nav.network' });
        }
        items.push({ path: '/history', labelKey: 'nav.history' });
        items.push({ path: '/invoices', labelKey: 'nav.invoices' });
        if (this.authService.isAdminOrAbove()) {
            items.push({ path: '/users', labelKey: 'nav.users' });
        }
        return items;
    }

    toggleSidebar(): void {
        this.setSidebarOpen(!this.isSidebarOpen());
    }

    closeSidebar(): void {
        this.setSidebarOpen(false);
    }

    setLanguage(lang: AppLanguage): void {
        this.transloco.setActiveLang(lang);
        storeLanguage(lang);
    }

    logout(): void {
        this.closeSidebar();
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    turnOff(): void {
        if (!confirm(this.transloco.translate('system.confirmTurnOff'))) {
            return;
        }
        this.systemService.shutdown().subscribe({
            next: () => this.finishShutdown(),
            error: () => this.finishShutdown(),
        });
    }

    /** Best-effort: browsers only honor window.close() on a window/tab the script
     *  itself opened, or one with no navigation history yet - neither is true for
     *  most sessions here, so this silently no-ops in the common case. The
     *  "server stopped" screen (driven by isShutdown) is the real fallback. */
    private finishShutdown(): void {
        this.systemService.isShutdown.set(true);
        window.close();
    }

    private setSidebarOpen(open: boolean): void {
        this.isSidebarOpen.set(open);
        this.document.body.classList.toggle('no-scroll', open);
    }
}
