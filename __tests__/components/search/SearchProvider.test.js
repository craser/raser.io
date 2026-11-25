// ABOUTME: Tests how SearchProvider turns search terms into results, completion and selection.
// ABOUTME: Drives the context directly through a probe component rather than the search UI.

import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchProvider, { useSearchContext } from '@/components/search/SearchProvider';

const STUBS = [
    { entryId: 101, datePosted: Date.now(), intro: 'Intro 1', body: 'lorem ipsum faucibus' },
    { entryId: 102, datePosted: Date.now(), intro: 'Intro 2', body: 'dolor sit amet faucibus' },
];

const mockPostDao = { getSearchStubs: jest.fn() };

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({ getPostDao: () => mockPostDao }),
}));

jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: () => ({ fireUiEngagement: jest.fn() }),
}));

jest.mock('next/router', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

let context;

function ContextProbe() {
    context = useSearchContext();
    return <span data-testid="result-count">{context.getSearchResults().length}</span>;
}

/** Renders the provider and opens search, which loads the index. */
async function renderProvider() {
    const rendered = render(<SearchProvider><ContextProbe/></SearchProvider>);
    act(() => context.showSearchUi(true));
    await waitFor(() => expect(mockPostDao.getSearchStubs).toHaveBeenCalled());
    // Let the stubs promise settle so the search index exists.
    await act(async () => {});
    return rendered;
}

describe('SearchProvider', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        mockPostDao.getSearchStubs.mockReset().mockResolvedValue(STUBS);
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    it('does not load the search index until search is opened', async () => {
        render(<SearchProvider><ContextProbe/></SearchProvider>);
        await act(async () => {});
        expect(mockPostDao.getSearchStubs).not.toHaveBeenCalled();
    });

    it('loads the search index when search is first opened', async () => {
        render(<SearchProvider><ContextProbe/></SearchProvider>);
        act(() => context.showSearchUi(true));
        await act(async () => {});
        expect(mockPostDao.getSearchStubs).toHaveBeenCalledTimes(1);
    });

    it('loads the search index when / is pressed', async () => {
        render(<SearchProvider><ContextProbe/></SearchProvider>);
        act(() => document.dispatchEvent(new KeyboardEvent('keyup', { key: '/' })));
        await act(async () => {});
        expect(mockPostDao.getSearchStubs).toHaveBeenCalledTimes(1);
        expect(context.isUiVisible()).toBe(true);
    });

    it('loads the search index only once, however often search is opened', async () => {
        await renderProvider();
        act(() => context.showSearchUi(false));
        act(() => context.showSearchUi(true));
        await act(async () => {});
        expect(mockPostDao.getSearchStubs).toHaveBeenCalledTimes(1);
    });

    it('searches terms typed before the index has loaded once it arrives', async () => {
        let resolveStubs;
        mockPostDao.getSearchStubs.mockReturnValue(new Promise(resolve => { resolveStubs = resolve; }));
        render(<SearchProvider><ContextProbe/></SearchProvider>);
        act(() => context.showSearchUi(true));
        act(() => context.setSearchTerms('faucib'));
        expect(context.getSearchResults()).toEqual([]);

        await act(async () => resolveStubs(STUBS));
        expect(context.getSearchResults()).toHaveLength(2);
        expect(context.getCompletion()).toBe('us');
    });

    it('closes search and hides it when the index fails to load', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockPostDao.getSearchStubs.mockRejectedValue(new Error('offline'));
        render(<SearchProvider><ContextProbe/></SearchProvider>);
        act(() => context.showSearchUi(true));
        await act(async () => {});
        expect(context.isSearchAvailable()).toBe(false);
        expect(context.isUiVisible()).toBe(false);
        console.error.mockRestore();
    });

    it('starts with no terms, results or selection', async () => {
        await renderProvider();
        expect(context.getSearchResults()).toEqual([]);
        expect(context.getCompletion()).toBe('');
        expect(context.getSelectedResult()).toBe(-1);
    });

    it('finds results once the terms reach the minimum length', async () => {
        await renderProvider();
        act(() => context.setSearchTerms('faucib'));
        expect(context.getSearchResults()).toHaveLength(2);
        expect(context.getCompletion()).toBe('us');
    });

    it('clears results and completion when the terms drop below the minimum length', async () => {
        await renderProvider();
        act(() => context.setSearchTerms('faucib'));
        act(() => context.setSearchTerms('fa'));
        expect(context.getSearchResults()).toEqual([]);
        expect(context.getCompletion()).toBe('');
    });

    it('clears the selection when the terms change', async () => {
        await renderProvider();
        act(() => context.setSearchTerms('faucib'));
        act(() => context.selectNextResult());
        act(() => context.selectNextResult());
        expect(context.getSelectedResult()).toBe(1);

        act(() => context.setSearchTerms('faucibu'));
        expect(context.getSelectedResult()).toBe(-1);
        expect(context.getSearchResults()).toHaveLength(2);
    });
});
