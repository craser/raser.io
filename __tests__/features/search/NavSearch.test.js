/**
 * Test the search function that appears in the navigation.
 *
 */

import { act, render } from "@testing-library/react";
import SearchContext from "@/components/search/SearchContext";
import Search from "@/components/search/Search";
import SearchButton from "@/components/search/SearchButton";
import { userEvent } from "@testing-library/user-event";
import PostDao from "@/model/PostDao";

async function renderScaffold() {
    return render(
        <SearchContext>
            <SearchButton/>
            <Search/>
        </SearchContext>
    );
}

jest.mock('next/router', () => {
    const router = { push: jest.fn };
    return {
        useRouter: jest.fn(() => router)
    }
});

jest.mock('@/model/PostDao', () => {
    const getSearchStubs = jest.fn().mockResolvedValue([
        { entryId: 101, datePosted: Date.now(), intro: "Intro 1", body: "lorem ipsum" },
        { entryId: 102, datePosted: Date.now(), intro: "Intro 2", body: "dolor sit amet" }
    ]);

    return jest.fn().mockImplementation(() => {
        return {
            getSearchStubs
        };
    });
});

describe('Navigation Search', () => {

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
        await act(() => {
            userEvent.click(button);
        });
        const input = await result.findByTestId('search-input');
        expect(input).not.toBeFalsy();
        await act(async () => {
            await userEvent.click(input);
            console.log('typing...');
            await userEvent.type(input, 'lorem');
        });
        expect(await result.container.querySelector('[data-testclass="search-result"]')).not.toBeFalsy();
    });

    test('Typing into the search input, then hitting TAB should cause the suggested completion to be used', async () => {
        const result = await renderScaffold();
        const button = await result.findByTestId('search-button');
        await act(() => {
            userEvent.click(button);
        });
        let input = await result.findByTestId('search-input');
        await act(async () => {
            await userEvent.click(input);
            console.log('typing...');
            await userEvent.type(input, 'lor');
        });
        input = await result.findByTestId('search-input');
        let completion = await result.findByTestId('search-completion');

        expect(input.value).toBe('lor');
        expect(completion.textContent).toBe('em');

        await act(async () => {
            input.focus();
            await userEvent.tab();
        })
        expect(input.value).toBe('lorem');
    });
});
