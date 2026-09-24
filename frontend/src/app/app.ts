import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Navbar } from './shared/components/navbar/navbar';
import { AuthService } from './core/services/auth.service';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { SystemService } from './core/services/system.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, Navbar, TranslocoPipe],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    constructor(
        public authService: AuthService,
        public systemService: SystemService,
        private pwaUpdateService: PwaUpdateService,
    ) {}
}
