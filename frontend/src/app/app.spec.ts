import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco } from '@jsverse/transloco';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { SystemService } from './core/services/system.service';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideRouter([]),
                provideServiceWorker('ngsw-worker.js', { enabled: false }),
                provideTransloco({
                    config: { availableLangs: ['en', 'fr'], defaultLang: 'en', fallbackLang: 'en' },
                    loader: TranslocoHttpLoader,
                }),
            ],
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it('shows the normal shell (no shutdown screen) by default', () => {
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.shutdown-screen')).toBeNull();
        expect(fixture.nativeElement.querySelector('main')).not.toBeNull();
    });

    it('replaces the app shell with the shutdown screen once SystemService.isShutdown is true', async () => {
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();
        const systemService = TestBed.inject(SystemService);

        systemService.isShutdown.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.shutdown-screen')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('main')).toBeNull();
    });
});
