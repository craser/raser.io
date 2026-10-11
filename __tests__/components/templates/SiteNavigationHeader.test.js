// ABOUTME: Verifies SiteNavigationHeader renders the search control and the High Contrast Mode toggle, and nothing else.
// ABOUTME: The userLogin flag is mocked ON so the nav is held to staying clean even if the flag is still live.
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import SiteNavigationHeader from '@/components/templates/SiteNavigationHeader';

jest.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: jest.fn(),
    withLDProvider: (config) => (Component) => Component
}));

// SearchButton reaches for the search context, which is not what this test is about.
jest.mock('@/components/search/SearchButton', () => {
    return function MockSearchButton() {
        return <div data-testid="mock-search-button"/>;
    };
});

jest.mock('@/components/theme/HighContrastToggle', () => {
    return function MockHighContrastToggle() {
        return <div data-testid="mock-high-contrast-toggle"/>;
    };
});

describe('SiteNavigationHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // userLogin deliberately ON. The nav must stay free of login controls regardless.
        useFlags.mockReturnValue({ navSearch: true, userLogin: true });
    });

    it('renders the search control', () => {
        const { getByTestId } = render(<SiteNavigationHeader/>);
        expect(getByTestId('mock-search-button')).toBeInTheDocument();
    });

    it('renders the High Contrast Mode toggle to the right of search', () => {
        const { getByTestId } = render(<SiteNavigationHeader/>);
        const items = Array.from(getByTestId('site-nav').children);
        expect(items[1]).toContainElement(getByTestId('mock-high-contrast-toggle'));
        expect(items[0]).toContainElement(getByTestId('mock-search-button'));
    });

    it('still renders the High Contrast Mode toggle when search is off', () => {
        useFlags.mockReturnValue({ navSearch: false });
        const { getByTestId, queryByTestId } = render(<SiteNavigationHeader/>);
        expect(queryByTestId('mock-search-button')).toBeNull();
        expect(getByTestId('mock-high-contrast-toggle')).toBeInTheDocument();
    });

    it('renders no authentication controls, even with the userLogin flag on', () => {
        const { getByTestId } = render(<SiteNavigationHeader/>);
        expect(getByTestId('site-nav').children.length).toBe(2);
    });
});
