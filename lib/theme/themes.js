// ABOUTME: The site's CSS themes, and how the chosen one is remembered and applied to the page.
// ABOUTME: A theme is a data-theme attribute on <html>; each theme's styles live in styles/themes/.

export const THEMES = Object.freeze({
    DEFAULT: 'default',
    HIGH_CONTRAST_DARK: 'high-contrast-dark'
});

export const THEME_STORAGE_KEY = 'raserio.theme';
export const THEME_ATTRIBUTE = 'data-theme';

export function isKnownTheme(theme) {
    return Object.values(THEMES).includes(theme);
}

function defaultStorage() {
    try {
        return window.localStorage;
    } catch (e) {
        return null; // private browsing, blocked storage, or no window at all
    }
}

export function readStoredTheme(storage = defaultStorage()) {
    try {
        const theme = storage?.getItem(THEME_STORAGE_KEY);
        return isKnownTheme(theme) ? theme : THEMES.DEFAULT;
    } catch (e) {
        return THEMES.DEFAULT;
    }
}

export function storeTheme(theme, storage = defaultStorage()) {
    try {
        if (theme === THEMES.DEFAULT) {
            storage?.removeItem(THEME_STORAGE_KEY);
        } else {
            storage?.setItem(THEME_STORAGE_KEY, theme);
        }
    } catch (e) {
        // Not remembering the choice is fine; the theme still applies for this page view.
    }
}

/**
 * The default theme is the absence of the attribute, so the site's base styles need no selector.
 */
export function applyTheme(theme, root = document.documentElement) {
    if (theme === THEMES.DEFAULT || !isKnownTheme(theme)) {
        root.removeAttribute(THEME_ATTRIBUTE);
    } else {
        root.setAttribute(THEME_ATTRIBUTE, theme);
    }
}

/**
 * Runs in <head> before the page paints, so a stored theme doesn't flash the default first.
 * Kept to plain ES5 since it's inlined as-is, outside the bundle.
 */
export const THEME_BOOT_SCRIPT = `(function () {
    try {
        var theme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
        var known = ${JSON.stringify(Object.values(THEMES).filter(t => t !== THEMES.DEFAULT))};
        if (known.indexOf(theme) !== -1) {
            document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)}, theme);
        }
    } catch (e) {}
})();`;
