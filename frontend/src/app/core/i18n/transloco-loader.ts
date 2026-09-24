import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { en } from './lang/en';
import { fr } from './lang/fr';

const TRANSLATIONS: Record<string, Translation> = { en, fr };

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
    /*private http = inject(HttpClient);

    getTranslation(lang: string) {
        return this.http.get<Translation>(`assets/i18n/${lang}.json`);
    }*/

    getTranslation(lang: string): Observable<Translation> {
        // return this.http.get<Translation>(`assets/i18n/${lang}.json`);
        return of(TRANSLATIONS[lang] ?? TRANSLATIONS['en']);
    }
}
