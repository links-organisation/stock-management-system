import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NetworkInfo } from '../../core/models/network.model';
import { NetworkSharingService } from '../../core/services/network-sharing.service';

@Component({
    selector: 'app-network-sharing',
    standalone: true,
    imports: [TranslocoPipe],
    templateUrl: './network-sharing.html',
    styleUrl: './network-sharing.scss',
})
export class NetworkSharing implements OnInit {
    isLoading = signal(true);
    errorMessage = signal('');
    networkInfo = signal<NetworkInfo | null>(null);
    copiedUrl = signal<string | null>(null);

    private networkSharingService = inject(NetworkSharingService);
    private transloco = inject(TranslocoService);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');
        this.networkSharingService.getNetworkInfo().subscribe({
            next: (info) => {
                this.networkInfo.set(info);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set(this.transloco.translate('network.loadError'));
                this.isLoading.set(false);
            },
        });
    }

    copy(url: string): void {
        navigator.clipboard.writeText(url);
        this.copiedUrl.set(url);
        setTimeout(() => this.copiedUrl.set(null), 2000);
    }
}
