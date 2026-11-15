// ABOUTME: Tests SearchButton, the nav button that opens the search UI.
// ABOUTME: It shows only while the search context says search is available.

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchButton from '@/components/search/SearchButton';
import { useSearchContext } from '@/components/search/SearchProvider';

jest.mock('@/components/search/SearchProvider', () => ({
    useSearchContext: jest.fn(),
}));

jest.mock('@/components/navigation/NavButton.module.scss', () => ({}));

jest.mock('lucide-react', () => ({
    Search: () => <b/>,
}));

function mockSearchContext(available) {
    const context = {
        isSearchAvailable: () => available,
        showSearchUi: jest.fn(),
    };
    useSearchContext.mockReturnValue(context);
    return context;
}

describe('SearchButton', () => {
    it('shows the button while search is available', () => {
        mockSearchContext(true);
        const { getByTestId } = render(<SearchButton/>);
        expect(getByTestId('search-button')).toBeInTheDocument();
    });

    it('renders nothing while search is unavailable', () => {
        mockSearchContext(false);
        const { queryByTestId } = render(<SearchButton/>);
        expect(queryByTestId('search-button')).toBeNull();
    });

    it('disappears when search becomes unavailable', () => {
        mockSearchContext(true);
        const { queryByTestId, rerender } = render(<SearchButton/>);
        mockSearchContext(false);
        rerender(<SearchButton/>);
        expect(queryByTestId('search-button')).toBeNull();
    });

    it('opens the search UI when clicked', () => {
        const context = mockSearchContext(true);
        const { getByTestId } = render(<SearchButton/>);
        getByTestId('search-button').click();
        expect(context.showSearchUi).toHaveBeenCalledWith(true);
    });
});
