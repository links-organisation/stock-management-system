import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '@core/i18n/transloco-loader';
import { NetworkInfo } from '@core/models/network.model';
import { NetworkSharingWidget } from './network-sharing-widget';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const info: NetworkInfo = {
    enabled: true,
    https: false,
    certificateValid: false,
    port: 8080,
    addresses: [{ interfaceName: 'Wi-Fi', ip: '192.168.1.15', url: 'http://192.168.1.15:8080' }],
};

const httpsInfo: NetworkInfo = {
    enabled: true,
    https: true,
    certificateValid: true,
    port: 8443,
    addresses: [{ interfaceName: 'Wi-Fi', ip: '192.168.1.15', url: 'https://192.168.1.15:8443' }],
};

describe('NetworkSharingWidget', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NetworkSharingWidget],
            providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), transloco()],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('starts collapsed, showing only the share button, with no request fired', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();

        expect(fixture.componentInstance.isSharing()).toBe(false);
        expect(fixture.nativeElement.querySelector('.network-widget__toggle')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.network-widget__panel')).toBeNull();
        httpMock.expectNone((r) => r.url.endsWith('/network/info'));
    });

    it('share() opens the panel and fetches network info', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();

        fixture.componentInstance.share();
        fixture.detectChanges();

        expect(fixture.componentInstance.isSharing()).toBe(true);
        expect(fixture.componentInstance.isLoading()).toBe(true);

        httpMock.expectOne((r) => r.url.endsWith('/network/info') && r.method === 'GET').flush(info);
        fixture.detectChanges();

        expect(fixture.componentInstance.networkInfo()).toEqual(info);
        expect(fixture.nativeElement.textContent).toContain('192.168.1.15:8080');
    });

    it('shows the empty state when no address was detected', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();

        httpMock
            .expectOne((r) => r.url.endsWith('/network/info'))
            .flush({ enabled: false, https: false, certificateValid: false, port: 8080, addresses: [] });
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.empty')).not.toBeNull();
    });

    it('shows an error message when the request fails', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();

        httpMock
            .expectOne((r) => r.url.endsWith('/network/info'))
            .flush('boom', { status: 500, statusText: 'Server Error' });
        fixture.detectChanges();

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
    });

    it('collapse() hides the panel again', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(info);
        fixture.detectChanges();

        fixture.componentInstance.collapse();
        fixture.detectChanges();

        expect(fixture.componentInstance.isSharing()).toBe(false);
        expect(fixture.nativeElement.querySelector('.network-widget__panel')).toBeNull();
    });

    it('copy() writes the URL to the clipboard and sets copiedUrl', () => {
        const writeTextSpy = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextSpy }, configurable: true });
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(info);

        fixture.componentInstance.copy('http://192.168.1.15:8080');

        expect(writeTextSpy).toHaveBeenCalledWith('http://192.168.1.15:8080');
        expect(fixture.componentInstance.copiedUrl()).toBe('http://192.168.1.15:8080');
    });

    it('copy() clears copiedUrl after the transient feedback window', () => {
        vi.useFakeTimers();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            configurable: true,
        });
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(info);

        fixture.componentInstance.copy('http://192.168.1.15:8080');
        vi.advanceTimersByTime(2000);

        expect(fixture.componentInstance.copiedUrl()).toBeNull();
        vi.useRealTimers();
    });

    it('toggleQr() shows the QR code image for an address, and hides it again on a second toggle', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(info);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.network-widget__qr img')).toBeNull();

        fixture.componentInstance.toggleQr('http://192.168.1.15:8080');
        fixture.detectChanges();

        expect(fixture.componentInstance.expandedQrUrl()).toBe('http://192.168.1.15:8080');
        const img = fixture.nativeElement.querySelector('.network-widget__qr img');
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toBe(
            fixture.componentInstance.qrCodeUrl('http://192.168.1.15:8080'),
        );

        fixture.componentInstance.toggleQr('http://192.168.1.15:8080');
        fixture.detectChanges();

        expect(fixture.componentInstance.expandedQrUrl()).toBeNull();
        expect(fixture.nativeElement.querySelector('.network-widget__qr img')).toBeNull();
    });

    it('qrCodeUrl() delegates to the network sharing service', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);

        const url = fixture.componentInstance.qrCodeUrl('http://192.168.1.15:8080');

        expect(url).toContain('/network/qrcode?url=');
        expect(url).toContain(encodeURIComponent('http://192.168.1.15:8080'));
    });

    it('hides the certificate download link when https is unavailable', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(info);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.network-widget__certificate')).toBeNull();
    });

    it('shows the certificate download link when https is available with a valid certificate', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(httpsInfo);
        fixture.detectChanges();

        const link = fixture.nativeElement.querySelector('.network-widget__certificate a');
        expect(link).not.toBeNull();
        expect(link.getAttribute('href')).toBe(fixture.componentInstance.certificateDownloadUrl);
        expect(link.getAttribute('download')).toBe('stockroom-cert.pem');
    });

    it('install instructions are collapsed by default and toggle open/closed', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(httpsInfo);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.network-widget__cert-help')).toBeNull();

        fixture.componentInstance.toggleCertificateHelp();
        fixture.detectChanges();

        expect(fixture.componentInstance.showCertificateHelp()).toBe(true);
        expect(fixture.nativeElement.querySelector('.network-widget__cert-help')).not.toBeNull();

        fixture.componentInstance.toggleCertificateHelp();
        fixture.detectChanges();

        expect(fixture.componentInstance.showCertificateHelp()).toBe(false);
        expect(fixture.nativeElement.querySelector('.network-widget__cert-help')).toBeNull();
    });

    it('defaults to Windows install steps and switches steps when another platform is selected', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        fixture.detectChanges();
        fixture.componentInstance.share();
        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(httpsInfo);
        fixture.detectChanges();
        fixture.componentInstance.toggleCertificateHelp();
        fixture.detectChanges();

        expect(fixture.componentInstance.certificatePlatform()).toBe('windows');
        expect(fixture.nativeElement.textContent).toContain('Trusted Root Certification Authorities');

        fixture.componentInstance.selectCertificatePlatform('android');
        fixture.detectChanges();

        expect(fixture.componentInstance.certificatePlatform()).toBe('android');
        expect(fixture.nativeElement.textContent).toContain('Install a certificate');
        expect(fixture.nativeElement.textContent).not.toContain('Trusted Root Certification Authorities');
    });

    it('certificatePlatformLabelKey() and certificatePlatformStepsKey() build the expected translation keys', () => {
        const fixture = TestBed.createComponent(NetworkSharingWidget);
        const component = fixture.componentInstance;

        expect(component.certificatePlatformLabelKey('macos')).toBe('network.certificateInstall.platformMacos');
        expect(component.certificatePlatformLabelKey('ios')).toBe('network.certificateInstall.platformIos');
        expect(component.certificatePlatformStepsKey('linux')).toBe('network.certificateInstall.linux');
    });
});
