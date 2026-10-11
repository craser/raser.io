// ABOUTME: Verifies ThemeProvider picks up the stored theme on mount and applies and remembers changes.
// ABOUTME: Uses jsdom's real localStorage and <html> element.
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import ThemeProvider, { useTheme } from '@/components/theme/ThemeProvider';
import { THEMES, THEME_STORAGE_KEY } from '@/lib/theme/themes';

function ThemeProbe() {
    const { theme, setTheme } = useTheme();
    return (
        <>
            <span data-testid="theme">{theme}</span>
            <button onClick={() => setTheme(THEMES.HIGH_CONTRAST_DARK)}>hc</button>
            <button onClick={() => setTheme(THEMES.DEFAULT)}>default</button>
        </>
    );
}

function renderProbe() {
    return render(<ThemeProvider><ThemeProbe/></ThemeProvider>);
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('starts on the default theme when nothing is stored', () => {
        renderProbe();
        expect(screen.getByTestId('theme')).toHaveTextContent(THEMES.DEFAULT);
    });

    it('picks up a stored theme after mount', () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, THEMES.HIGH_CONTRAST_DARK);
        renderProbe();
        expect(screen.getByTestId('theme')).toHaveTextContent(THEMES.HIGH_CONTRAST_DARK);
    });

    it('applies and remembers a new theme', () => {
        renderProbe();
        act(() => screen.getByText('hc').click());
        expect(screen.getByTestId('theme')).toHaveTextContent(THEMES.HIGH_CONTRAST_DARK);
        expect(document.documentElement.getAttribute('data-theme')).toBe(THEMES.HIGH_CONTRAST_DARK);
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(THEMES.HIGH_CONTRAST_DARK);
    });

    it('goes back to the default theme', () => {
        renderProbe();
        act(() => screen.getByText('hc').click());
        act(() => screen.getByText('default').click());
        expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    });

    it('gives a harmless default context outside a provider', () => {
        render(<ThemeProbe/>);
        expect(screen.getByTestId('theme')).toHaveTextContent(THEMES.DEFAULT);
        expect(() => act(() => screen.getByText('hc').click())).not.toThrow();
    });
});
