/**
 * Test the search function that appears in the navigation.
 *
 */

import { act, render, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import SearchProvider from "@/components/search/SearchProvider";
import Search from "@/components/search/Search";
import SearchButton from "@/components/search/SearchButton";
import SAMPLE_SEARCH_STUBS from "@/__tests__/components/search/SampleSearchStubs.json"
import { useDataContext } from "@/components/api/DataProvider";
import { useRouter } from "next/router";


const MOCK_SEARCH_STUBS = [
    // "lorem" should only appear in ONE of the stubs below - see tests below
    { entryId: 101, datePosted: Date.now(), intro: "Intro 1", body: "lorem ipsum" },
    { entryId: 102, datePosted: Date.now(), intro: "Intro 2", body: "dolor sit amet" }
];

async function renderScaffold() {
    return render(
        <SearchProvider>
            <SearchButton/>
            <Search/>
        </SearchProvider>
    );
}

jest.mock('lucide-react', () => {
    return {
        Search: () => <b>search icon</b>
    };
});

jest.mock('@/components/api/DataProvider', () => {
    let mockPostDao = { getSearchStubs: jest.fn() };
    let mockDataContext = {
        getPostDao: () => mockPostDao
    };
    return {
        useDataContext: () => mockDataContext
    };
});

/* SearchResult calls router.push() when clicked. We intercept that call here.
 */
jest.mock('next/router', () => {
    return { useRouter: jest.fn() };
});

describe('Navigation Search', () => {

    beforeEach(() => {
        jest.resetAllMocks();
        useDataContext().getPostDao().getSearchStubs.mockResolvedValue(MOCK_SEARCH_STUBS);
        useRouter.mockReturnValue({ push: jest.fn() });
    });

    test('Initial render should show the search button, and NOT the search itself.', async () => {
        const result = await renderScaffold();
        expect(await result.findByTestId('search-button')).not.toBeFalsy();
        // expect that the full search ui will NOT exist yet.
        expect(await result.queryByTestId('search-ui')).toBeNull();
    });

    test('Clicking the search button should show the UI', async () => {
        const result = await renderScaffold();
        await act(async () => {
            let button = await result.findByTestId('search-button');
            button.click();
        });
        expect(await result.findByTestId('search-ui')).not.toBeFalsy();
    });

    test('Typing a / should show the UI, including the text input & results', async () => {
        const result = await renderScaffold();
        await act(() => {
            userEvent.type(result.container, '/');
        });
        expect(await result.findByTestId('search-ui')).not.toBeFalsy();
        expect(await result.findByTestId('search-input')).not.toBeFalsy();
        expect(await result.findByTestId('search-results')).not.toBeFalsy();
    });

    test('Typing into the search input should cause results to appear', async () => {
        const result = await renderScaffold();
        const button = await result.findByTestId('search-button');
        await act(async () => {
            await userEvent.click(button);
        });
        const input = await result.findByTestId('search-input');
        expect(input).not.toBeFalsy();
        await act(async () => {
            await userEvent.click(input);
            await userEvent.type(input, 'lorem');
        });
        expect(await result.container.querySelector('[data-testclass="search-result"]')).not.toBeFalsy();
    });

    test('Should show matched words from post, NOT just search terms', async () => {
        const result = await renderScaffold();
        const button = await result.findByTestId('search-button');
        await act(() => {
            userEvent.click(button);
        });
        const input = await result.findByTestId('search-input');
        expect(input).not.toBeFalsy();
        await act(async () => {
            await userEvent.click(input);
            await userEvent.type(input, 'lor');
        });
        const resultDiv = await result.container.querySelector('[data-testclass="search-result"]');
        expect(resultDiv).not.toBeFalsy();
        expect(resultDiv.textContent).toContain('lorem');
    });


    test('Typing into the search input, then hitting TAB should cause the suggested completion to be used', async () => {
        const result = await renderScaffold();
        const button = await result.findByTestId('search-button');
        await act(async () => {
            await userEvent.click(button);
        });
        let input = await result.findByTestId('search-input');
        await userEvent.click(input);
        await userEvent.type(input, 'lor');
        await userEvent.tab();
        expect(input.value).toBe('lorem');
    });

    test('If search stubs cannot be retrieved, do not show search button or UI.', async () => {
        useDataContext().getPostDao().getSearchStubs.mockReturnValueOnce(new Promise(function () {
            throw new Error('nope!');
        }));

        const result = await renderScaffold();
        // WARNING! When debugging, be aware that waitFor has a default timeout of 1000ms.
        // It'll fail to work properly if you hit breakpoints while it's looping.
        await waitFor(async () => {
            const button = await result.queryByTestId('search-button');
            expect(button).not.toBeTruthy();
        });
        let button = await result.queryByTestId('search-button');
        let ui = await result.queryByTestId('search-ui');
        expect(button).not.toBeTruthy();
        expect(ui).not.toBeTruthy();
    });

    test('Should not show recommended completion when token is empty', async () => {
        const result = await renderScaffold();
        const button = await result.findByTestId('search-button');
        await act(async () => {
            await userEvent.click(button);
        });
        let input = await result.findByTestId('search-input');
        await act(async () => {
            await userEvent.click(input);
            await userEvent.type(input, 'lor ');
        });
        const completion = await result.findByTestId('search-completion');
        expect(completion.textContent).toBe('');
    });

    test('Should show "avor" as completion', async () => {
        // Clear previous mocks and state
        jest.clearAllMocks();

        // Setup test data before component render
        useDataContext().getPostDao().getSearchStubs.mockResolvedValueOnce(SAMPLE_SEARCH_STUBS);

        const result = await renderScaffold();

        // Wait for initial render and click button
        const button = await result.findByTestId('search-button');
        await userEvent.click(button);

        // Wait for input to be available and type
        const input = await result.findByTestId('search-input');
        await userEvent.click(input);
        await userEvent.type(input, 'corner f');

        // Wait for completion with increased timeout
        await waitFor(() => {
            const completion = result.getByTestId('search-completion');
            expect(completion.textContent).toBe('avor');
        }, { timeout: 10000 });
    }, 15000); // Increase overall test timeout

    test('Hitting ENTER should cause the selected result to be shown', async () => {
        const result = await renderScaffold();
        const button = await result.findByTestId('search-button');
        await userEvent.click(button);
        const input = await result.findByTestId('search-input');
        await userEvent.type(input, 'lorem');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => {
            expect(useRouter().push).toHaveBeenCalled();
        });
    });

    test('The correct URL should be passed to push()', async () => {
        const result = await renderScaffold();
        const button = await result.findByTestId('search-button');
        await userEvent.click(button);
        const input = await result.findByTestId('search-input');
        await userEvent.type(input, 'lorem');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => {
            expect(useRouter().push).toHaveBeenCalledWith('/archive/101');
        });
    });

});
