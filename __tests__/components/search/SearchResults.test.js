// ABOUTME: Tests SearchResults, the list of matches shown under the search input.
// ABOUTME: Selecting a result marks it and scrolls it into view, including after the terms change.

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchResults from '@/components/search/SearchResults';
import { useSearchContext } from '@/components/search/SearchProvider';

jest.mock('@/components/search/SearchProvider', () => ({
    useSearchContext: jest.fn(),
}));

const RESULTS = [
    { post: { entryId: 1, title: 'First', datePosted: '2024-06-22T00:00:00Z' }, text: 'lorem one' },
    { post: { entryId: 2, title: 'Second', datePosted: '2024-06-23T00:00:00Z' }, text: 'lorem two' },
];

function mockSearchContext({ terms, selectedIndex }) {
    useSearchContext.mockReturnValue({
        minSearchTermLength: 3,
        getSearchTerms: () => terms,
        getSearchResults: () => RESULTS,
        getSelectedResult: () => selectedIndex,
        goToResult: jest.fn(),
    });
}

function resultElements(container) {
    return container.querySelectorAll('[data-testclass="search-result"]');
}

describe('SearchResults', () => {
    let scrollIntoView;

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        scrollIntoView = jest.fn();
        Element.prototype.scrollIntoView = scrollIntoView;
    });

    afterEach(() => {
        console.log.mockRestore();
        delete Element.prototype.scrollIntoView;
    });

    it('marks the selected result and scrolls it into view', () => {
        mockSearchContext({ terms: 'lorem', selectedIndex: -1 });
        const { container, rerender } = render(<SearchResults/>);

        mockSearchContext({ terms: 'lorem', selectedIndex: 1 });
        rerender(<SearchResults/>);

        const results = resultElements(container);
        expect(results[1]).toHaveClass('selectedResult');
        expect(results[0]).not.toHaveClass('selectedResult');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(results[1]);
    });

    it('still scrolls the selection into view after the terms change', () => {
        mockSearchContext({ terms: 'lorem', selectedIndex: 0 });
        const { container, rerender } = render(<SearchResults/>);
        mockSearchContext({ terms: 'lore', selectedIndex: 0 });
        rerender(<SearchResults/>);
        scrollIntoView.mockClear();

        mockSearchContext({ terms: 'lore', selectedIndex: 1 });
        rerender(<SearchResults/>);

        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(resultElements(container)[1]);
    });
});
