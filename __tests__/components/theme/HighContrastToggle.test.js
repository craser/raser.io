// ABOUTME: Verifies the High Contrast Mode toggle reflects and flips the high-contrast-dark theme.
// ABOUTME: Rendered inside the real ThemeProvider so the <html> attribute is checked end to end.
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import ThemeProvider from '@/components/theme/ThemeProvider';
import HighContrastToggle from '@/components/theme/HighContrastToggle';
import { THEMES, THEME_STORAGE_KEY } from '@/lib/theme/themes';

jest.mock('lucide-react', () => ({
    Contrast: () => <svg data-testid="contrast-icon"/>
}));

function renderToggle() {
    return render(<ThemeProvider><HighContrastToggle/></ThemeProvider>);
}

describe('HighContrastToggle', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('is a switch named High Contrast Mode, off by default', () => {
        renderToggle();
        const toggle = screen.getByRole('switch', { name: 'High Contrast Mode' });
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        expect(toggle).toHaveAttribute('title', 'High Contrast Mode');
    });

    it('turns High Contrast Mode on', async () => {
        renderToggle();
        await userEvent.click(screen.getByRole('switch'));
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
        expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast-dark');
    });

    it('turns High Contrast Mode back off', async () => {
        renderToggle();
        await userEvent.click(screen.getByRole('switch'));
        await userEvent.click(screen.getByRole('switch'));
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
        expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('shows as on when High Contrast Mode was stored from an earlier visit', () => {
        window.localStorage.setItem(THEME_STORAGE_KEY, THEMES.HIGH_CONTRAST_DARK);
        renderToggle();
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
});
