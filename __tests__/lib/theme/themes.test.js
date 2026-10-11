// ABOUTME: Verifies theme storage, validation, and how a theme is applied to the <html> element.
// ABOUTME: Also runs the inline boot script to check it applies a stored theme before React loads.
import {
    THEMES,
    THEME_STORAGE_KEY,
    THEME_BOOT_SCRIPT,
    applyTheme,
    isKnownTheme,
    readStoredTheme,
    storeTheme
} from '@/lib/theme/themes';

describe('themes', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('knows its own themes and nothing else', () => {
        expect(isKnownTheme(THEMES.DEFAULT)).toBe(true);
        expect(isKnownTheme(THEMES.HIGH_CONTRAST_DARK)).toBe(true);
        expect(isKnownTheme('neon')).toBe(false);
        expect(isKnownTheme(null)).toBe(false);
    });

    describe('readStoredTheme', () => {
        it('defaults when nothing is stored', () => {
            expect(readStoredTheme()).toBe(THEMES.DEFAULT);
        });

        it('returns a stored known theme', () => {
            window.localStorage.setItem(THEME_STORAGE_KEY, THEMES.HIGH_CONTRAST_DARK);
            expect(readStoredTheme()).toBe(THEMES.HIGH_CONTRAST_DARK);
        });

        it('ignores a stored theme it does not know', () => {
            window.localStorage.setItem(THEME_STORAGE_KEY, 'neon');
            expect(readStoredTheme()).toBe(THEMES.DEFAULT);
        });

        it('defaults when storage throws', () => {
            const storage = { getItem: () => { throw new Error('blocked'); } };
            expect(readStoredTheme(storage)).toBe(THEMES.DEFAULT);
        });

        it('defaults when there is no storage', () => {
            expect(readStoredTheme(null)).toBe(THEMES.DEFAULT);
        });
    });

    describe('storeTheme', () => {
        it('remembers a non-default theme', () => {
            storeTheme(THEMES.HIGH_CONTRAST_DARK);
            expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(THEMES.HIGH_CONTRAST_DARK);
        });

        it('forgets the stored theme when going back to the default', () => {
            storeTheme(THEMES.HIGH_CONTRAST_DARK);
            storeTheme(THEMES.DEFAULT);
            expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
        });

        it('does not throw when storage throws', () => {
            const storage = { setItem: () => { throw new Error('full'); } };
            expect(() => storeTheme(THEMES.HIGH_CONTRAST_DARK, storage)).not.toThrow();
        });
    });

    describe('applyTheme', () => {
        it('sets data-theme on <html> for a non-default theme', () => {
            applyTheme(THEMES.HIGH_CONTRAST_DARK);
            expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast-dark');
        });

        it('removes data-theme for the default theme', () => {
            applyTheme(THEMES.HIGH_CONTRAST_DARK);
            applyTheme(THEMES.DEFAULT);
            expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
        });

        it('removes data-theme for an unknown theme', () => {
            applyTheme(THEMES.HIGH_CONTRAST_DARK);
            applyTheme('neon');
            expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
        });
    });

    describe('THEME_BOOT_SCRIPT', () => {
        const runBootScript = () => new Function(THEME_BOOT_SCRIPT)();

        it('applies a stored theme', () => {
            window.localStorage.setItem(THEME_STORAGE_KEY, THEMES.HIGH_CONTRAST_DARK);
            runBootScript();
            expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast-dark');
        });

        it('leaves the page alone when nothing is stored', () => {
            runBootScript();
            expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
        });

        it('ignores an unknown stored theme', () => {
            window.localStorage.setItem(THEME_STORAGE_KEY, '"><script>');
            runBootScript();
            expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
        });
    });
});
