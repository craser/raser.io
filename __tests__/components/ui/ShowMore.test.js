// ABOUTME: Tests ShowMore, which hides its children behind a "more" button.
// ABOUTME: Expanding sizes the container to the content's height; collapsing sets it back to zero.

import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShowMore from '@/components/ui/ShowMore';

jest.mock('lucide-react', () => ({
    ChevronUp: () => <b/>,
    ChevronDown: () => <b/>,
}));

const CONTENT_HEIGHT = 120;

describe('ShowMore', () => {
    beforeEach(() => {
        jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(CONTENT_HEIGHT);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function renderShowMore() {
        return render(<ShowMore><p>DUMMY_CONTENT</p></ShowMore>);
    }

    it('starts collapsed, with only the "more" button', () => {
        const { getByTestId, queryByTestId } = renderShowMore();
        expect(getByTestId('show-more-content').style.height).toBe('0px');
        expect(getByTestId('show-more')).toBeInTheDocument();
        expect(queryByTestId('show-less')).toBeNull();
    });

    it('expands to the content height when "more" is clicked', () => {
        const { getByTestId, queryByTestId } = renderShowMore();
        act(() => getByTestId('show-more').click());
        expect(getByTestId('show-more-content').style.height).toBe(`${CONTENT_HEIGHT}px`);
        expect(getByTestId('show-less')).toBeInTheDocument();
        expect(queryByTestId('show-more')).toBeNull();
    });

    it('collapses again when "less" is clicked', () => {
        const { getByTestId, queryByTestId } = renderShowMore();
        act(() => getByTestId('show-more').click());
        act(() => getByTestId('show-less').click());
        expect(getByTestId('show-more-content').style.height).toBe('0px');
        expect(getByTestId('show-more')).toBeInTheDocument();
        expect(queryByTestId('show-less')).toBeNull();
    });
});
