import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { AVAILABLE_LANGUAGES, readStoredLanguage } from './core/i18n/language';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(),
        provideServiceWorker('ngsw-worker.js', {
            enabled: import.meta.env.NG_APP_ENV !== 'development',
            registrationStrategy: 'registerWhenStable:30000',
        }),
        provideTransloco({
            config: {
                availableLangs: AVAILABLE_LANGUAGES,
                defaultLang: readStoredLanguage(),
                fallbackLang: 'en',
                reRenderOnLangChange: true,
                prodMode: import.meta.env.NG_APP_ENV !== 'development',
            },
            loader: TranslocoHttpLoader,
        }),
    ],
};
