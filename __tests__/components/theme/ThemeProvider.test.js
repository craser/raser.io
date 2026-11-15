// ABOUTME: Verifies ThemeProvider picks up the stored theme on mount and applies and remembers changes.
// ABOUTME: Uses jsdom's real localStorage and <html> element.
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server.node';
import { hydrateRoot } from 'react-dom/client';
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

    it('renders the default theme on the server even when a theme is stored', () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, THEMES.HIGH_CONTRAST_DARK);
        const container = document.createElement('div');
        container.innerHTML = renderToString(<ThemeProvider><ThemeProbe/></ThemeProvider>);
        expect(container.querySelector('[data-testid="theme"]')).toHaveTextContent(THEMES.DEFAULT);
    });

    it('hydrates server markup without a mismatch, then shows the stored theme', () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, THEMES.HIGH_CONTRAST_DARK);
        const container = document.createElement('div');
        container.innerHTML = renderToString(<ThemeProvider><ThemeProbe/></ThemeProvider>);
        document.body.appendChild(container);
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        let root;
        try {
            act(() => {
                root = hydrateRoot(container, <ThemeProvider><ThemeProbe/></ThemeProvider>);
            });
            expect(consoleError).not.toHaveBeenCalled();
            expect(container.querySelector('[data-testid="theme"]')).toHaveTextContent(THEMES.HIGH_CONTRAST_DARK);
        } finally {
            consoleError.mockRestore();
            act(() => root.unmount());
            container.remove();
        }
    });

    it('still applies a new theme when storage refuses to remember it', () => {
        const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('storage blocked');
        });
        try {
            renderProbe();
            act(() => screen.getByText('hc').click());
            expect(screen.getByTestId('theme')).toHaveTextContent(THEMES.HIGH_CONTRAST_DARK);
            expect(document.documentElement.getAttribute('data-theme')).toBe(THEMES.HIGH_CONTRAST_DARK);
        } finally {
            setItem.mockRestore();
        }
    });

    it('gives a harmless default context outside a provider', () => {
        render(<ThemeProbe/>);
        expect(screen.getByTestId('theme')).toHaveTextContent(THEMES.DEFAULT);
        expect(() => act(() => screen.getByText('hc').click())).not.toThrow();
    });
});
