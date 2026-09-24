import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from '../../core/i18n/transloco-loader';
import { NetworkInfo } from '../../core/models/network.model';
import { NetworkSharing } from './network-sharing';

function transloco() {
    return provideTransloco({
        config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
        loader: TranslocoHttpLoader,
    });
}

const info: NetworkInfo = {
    enabled: true,
    https: false,
    port: 8080,
    addresses: [
        { interfaceName: 'Wi-Fi', ip: '192.168.1.15', url: 'http://192.168.1.15:8080' },
        { interfaceName: 'Ethernet', ip: '192.168.1.20', url: 'http://192.168.1.20:8080' },
    ],
};

describe('NetworkSharing', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NetworkSharing],
            providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), transloco()],
        }).compileComponents();
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    function createLoaded(networkInfo: NetworkInfo = info) {
        const fixture = TestBed.createComponent(NetworkSharing);
        fixture.detectChanges();
        httpMock.expectOne((r) => r.url.endsWith('/network/info') && r.method === 'GET').flush(networkInfo);
        fixture.detectChanges();
        return fixture;
    }

    it('shows a loading state, then the address list once loaded', () => {
        const fixture = TestBed.createComponent(NetworkSharing);
        fixture.detectChanges();

        expect(fixture.componentInstance.isLoading()).toBe(true);

        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(info);
        fixture.detectChanges();

        expect(fixture.componentInstance.isLoading()).toBe(false);
        expect(fixture.componentInstance.networkInfo()).toEqual(info);
        expect(fixture.nativeElement.textContent).toContain('192.168.1.15:8080');
        expect(fixture.nativeElement.textContent).toContain('192.168.1.20:8080');
    });

    it('shows the empty state when no address was detected', () => {
        const fixture = createLoaded({ enabled: false, https: false, port: 8080, addresses: [] });

        expect(fixture.nativeElement.querySelector('.empty')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('shows an error message when the request fails', () => {
        const fixture = TestBed.createComponent(NetworkSharing);
        fixture.detectChanges();

        httpMock
            .expectOne((r) => r.url.endsWith('/network/info'))
            .flush('boom', { status: 500, statusText: 'Server Error' });
        fixture.detectChanges();

        expect(fixture.componentInstance.errorMessage()).not.toBe('');
        expect(fixture.componentInstance.isLoading()).toBe(false);
    });

    it('copy() writes the URL to the clipboard and sets copiedUrl', () => {
        const writeTextSpy = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextSpy }, configurable: true });
        const fixture = createLoaded();

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
        const fixture = createLoaded();

        fixture.componentInstance.copy('http://192.168.1.15:8080');
        expect(fixture.componentInstance.copiedUrl()).toBe('http://192.168.1.15:8080');

        vi.advanceTimersByTime(2000);

        expect(fixture.componentInstance.copiedUrl()).toBeNull();
        vi.useRealTimers();
    });

    it('load() re-fetches network info when the refresh button is used', () => {
        const fixture = createLoaded();

        fixture.componentInstance.load();

        httpMock.expectOne((r) => r.url.endsWith('/network/info')).flush(info);
    });
});
