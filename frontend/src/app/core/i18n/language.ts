export type AppLanguage = 'en' | 'fr';

export const AVAILABLE_LANGUAGES: AppLanguage[] = ['en', 'fr'];

const STORAGE_KEY = 'stock-management.lang';

export function readStoredLanguage(): AppLanguage {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'fr') {
            return stored;
        }
    } catch {
        // localStorage unavailable (private mode, SSR, etc.) - fall back below.
    }
    return 'en';
}

export function storeLanguage(lang: AppLanguage): void {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        // Ignore - nothing to persist to, next load just falls back to 'en'.
    }
}
