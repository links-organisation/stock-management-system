import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Navbar } from '@shared/components/navbar/navbar';
import { NetworkSharingWidget } from '@shared/components/network-sharing-widget/network-sharing-widget';
import { AuthService } from '@core/services/auth/auth.service';
import { PwaUpdateService } from '@core/services/pwa-update/pwa-update.service';
import { SystemService } from '@core/services/system/system.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, Navbar, NetworkSharingWidget, TranslocoPipe],
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
