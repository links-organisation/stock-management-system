import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
    path: string;
    label: string;
}

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    isSidebarOpen = false;

    constructor(
        public authService: AuthService,
        private router: Router,
        @Inject(DOCUMENT) private document: Document,
    ) {}

    get navItems(): NavItem[] {
        const items: NavItem[] = [
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/products', label: 'Products' },
        ];
        if (this.authService.canSell()) {
            items.push({ path: '/sales', label: 'Sell' });
        }
        if (this.authService.isAdminOrAbove()) {
            items.push({ path: '/inventory', label: 'Inventory' });
        }
        items.push({ path: '/history', label: 'History' });
        items.push({ path: '/invoices', label: 'Invoices' });
        if (this.authService.isAdminOrAbove()) {
            items.push({ path: '/users', label: 'Users' });
        }
        return items;
    }

    toggleSidebar(): void {
        this.setSidebarOpen(!this.isSidebarOpen);
    }

    closeSidebar(): void {
        this.setSidebarOpen(false);
    }

    logout(): void {
        this.closeSidebar();
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    private setSidebarOpen(open: boolean): void {
        this.isSidebarOpen = open;
        this.document.body.classList.toggle('no-scroll', open);
    }
}
