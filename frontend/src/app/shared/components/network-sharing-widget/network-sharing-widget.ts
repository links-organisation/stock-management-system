import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NetworkInfo } from '@core/models/network.model';
import { NetworkSharingService } from '@core/services/network-sharing/network-sharing.service';

export type CertificatePlatform = 'windows' | 'macos' | 'linux' | 'android' | 'ios';

@Component({
    selector: 'app-network-sharing-widget',
    standalone: true,
    imports: [TranslocoPipe],
    templateUrl: './network-sharing-widget.html',
    styleUrl: './network-sharing-widget.scss',
})
export class NetworkSharingWidget {
    isSharing = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    networkInfo = signal<NetworkInfo | null>(null);
    copiedUrl = signal<string | null>(null);
    expandedQrUrl = signal<string | null>(null);
    showCertificateHelp = signal(false);
    certificatePlatform = signal<CertificatePlatform>('windows');

    readonly certificatePlatforms: CertificatePlatform[] = ['windows', 'macos', 'linux', 'android', 'ios'];

    certificateDownloadUrl: string;

    private networkSharingService = inject(NetworkSharingService);
    private transloco = inject(TranslocoService);

    constructor() {
        this.certificateDownloadUrl = this.networkSharingService.getCertificateDownloadUrl();
    }

    share(): void {
        this.isSharing.set(true);
        this.load();
    }

    collapse(): void {
        this.isSharing.set(false);
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

    toggleQr(url: string): void {
        this.expandedQrUrl.set(this.expandedQrUrl() === url ? null : url);
    }

    qrCodeUrl(url: string): string {
        return this.networkSharingService.getQrCodeUrl(url);
    }

    toggleCertificateHelp(): void {
        this.showCertificateHelp.set(!this.showCertificateHelp());
    }

    selectCertificatePlatform(platform: CertificatePlatform): void {
        this.certificatePlatform.set(platform);
    }

    certificatePlatformLabelKey(platform: CertificatePlatform): string {
        return 'network.certificateInstall.platform' + platform.charAt(0).toUpperCase() + platform.slice(1);
    }

    certificatePlatformStepsKey(platform: CertificatePlatform): string {
        return 'network.certificateInstall.' + platform;
    }
}
