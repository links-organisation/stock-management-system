import { readStoredLanguage, storeLanguage } from './language';

const STORAGE_KEY = 'stock-management.lang';

describe('language', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('readStoredLanguage', () => {
        it('returns "en" when nothing is stored', () => {
            expect(readStoredLanguage()).toBe('en');
        });

        it('returns the stored language when it is a valid AppLanguage', () => {
            localStorage.setItem(STORAGE_KEY, 'fr');
            expect(readStoredLanguage()).toBe('fr');
        });

        it('falls back to "en" when the stored value is not a recognized language', () => {
            localStorage.setItem(STORAGE_KEY, 'de');
            expect(readStoredLanguage()).toBe('en');
        });

        it('falls back to "en" when localStorage access throws', () => {
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('blocked');
            });

            expect(readStoredLanguage()).toBe('en');
        });
    });

    describe('storeLanguage', () => {
        it('persists the language under the expected key', () => {
            storeLanguage('fr');
            expect(localStorage.getItem(STORAGE_KEY)).toBe('fr');
        });

        it('round-trips through readStoredLanguage', () => {
            storeLanguage('fr');
            expect(readStoredLanguage()).toBe('fr');
        });

        it('does not throw when localStorage access throws', () => {
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('blocked');
            });

            expect(() => storeLanguage('en')).not.toThrow();
        });
    });
});
