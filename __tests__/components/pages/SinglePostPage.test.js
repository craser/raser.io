// ABOUTME: Guards the props SinglePostPage hands to ReadPostView for a single post.
// ABOUTME: It renders the post it is given (never a cached copy) with its full body and next/prev navigation.
import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SinglePostPage from '@/components/pages/SinglePostPage';

const mockReadPostViewProps = [];

jest.mock('@/components/ReadPostView', () => {
    return function MockReadPostView(props) {
        mockReadPostViewProps.push(props);
        return <div data-testid="mock-read-post-view"/>;
    };
});

jest.mock('@/components/templates/StandardLayout', () => {
    return function MockStandardLayout({ content }) {
        return <div data-testid="mock-standard-layout">{content}</div>;
    };
});

jest.mock('@/components/templates/SingleSectionContent', () => {
    return function MockSingleSectionContent({ content }) {
        return <div data-testid="mock-single-section-content">{content}</div>;
    };
});

const mockPostBackgroundProps = [];

jest.mock('@/components/PostBackground', () => {
    return function MockPostBackground(props) {
        mockPostBackgroundProps.push(props);
        return <div data-testid="mock-post-background"/>;
    };
});

const mockAnalytics = { firePageView: jest.fn(), fireReferrer: jest.fn() };

jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: () => mockAnalytics
}));

const mockPostDao = {
    getPostById: jest.fn(),
    getNextPost: jest.fn(),
    getPrevPost: jest.fn()
};

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({
        getPostDao: () => mockPostDao
    })
}));

const POST = { entryId: 3421, title: 'DUMMY_TITLE' };
const NEXT = { entryId: 3422, title: 'DUMMY_NEXT' };
const PREV = { entryId: 3420, title: 'DUMMY_PREV' };

describe('SinglePostPage', () => {
    beforeEach(() => {
        mockReadPostViewProps.length = 0;
        mockPostBackgroundProps.length = 0;
        Object.values(mockAnalytics).forEach(f => f.mockReset());
        mockPostDao.getPostById.mockReset();
        mockPostDao.getNextPost.mockReset().mockResolvedValue(NEXT);
        mockPostDao.getPrevPost.mockReset().mockResolvedValue(PREV);
    });

    it('renders the post it is given straight away', () => {
        const { getByTestId } = render(<SinglePostPage post={POST}/>);
        expect(getByTestId('mock-read-post-view')).toBeInTheDocument();
        expect(mockReadPostViewProps[0].post).toBe(POST);
    });

    it('never looks the post up through the client-side DAO', async () => {
        render(<SinglePostPage post={POST}/>);
        await waitFor(() => expect(mockPostDao.getPrevPost).toHaveBeenCalled());
        expect(mockPostDao.getPostById).not.toHaveBeenCalled();
    });

    it('renders the full body with next/prev navigation', () => {
        render(<SinglePostPage post={POST}/>);
        expect(mockReadPostViewProps[0].showBody).toBe(true);
        expect(mockReadPostViewProps[0].showNextPrev).toBe(true);
    });

    it('loads the next and previous posts for the post it is given', async () => {
        render(<SinglePostPage post={POST}/>);
        await waitFor(() => {
            const props = mockReadPostViewProps[mockReadPostViewProps.length - 1];
            expect(props.next).toBe(NEXT);
            expect(props.prev).toBe(PREV);
        });
        expect(mockPostDao.getNextPost).toHaveBeenCalledWith(POST);
        expect(mockPostDao.getPrevPost).toHaveBeenCalledWith(POST);
    });

    it('shows the new post and its neighbours when it is given a different post', async () => {
        const other = { entryId: 17, title: 'DUMMY_OTHER' };
        const { rerender } = render(<SinglePostPage post={POST}/>);
        await waitFor(() => expect(mockReadPostViewProps[mockReadPostViewProps.length - 1].next).toBe(NEXT));
        mockPostDao.getNextPost.mockResolvedValue(null);
        mockPostDao.getPrevPost.mockResolvedValue(null);

        rerender(<SinglePostPage post={other}/>);
        expect(mockReadPostViewProps[mockReadPostViewProps.length - 1].post).toBe(other);
        expect(mockReadPostViewProps[mockReadPostViewProps.length - 1].next).toBeNull();
        await waitFor(() => expect(mockPostDao.getNextPost).toHaveBeenCalledWith(other));
    });

    it('ignores a slow neighbour lookup for a post it is no longer showing', async () => {
        const other = { entryId: 17, title: 'DUMMY_OTHER' };
        const otherNext = { entryId: 18, title: 'DUMMY_OTHER_NEXT' };
        const otherPrev = { entryId: 16, title: 'DUMMY_OTHER_PREV' };
        let resolveSlowNext;
        mockPostDao.getNextPost.mockImplementation((post) => (post === POST
            ? new Promise((resolve) => { resolveSlowNext = resolve; })
            : Promise.resolve(otherNext)));
        mockPostDao.getPrevPost.mockImplementation((post) => Promise.resolve(post === POST ? PREV : otherPrev));

        const { rerender } = render(<SinglePostPage post={POST}/>);
        rerender(<SinglePostPage post={other}/>);
        await waitFor(() => expect(mockReadPostViewProps[mockReadPostViewProps.length - 1].next).toBe(otherNext));

        await act(async () => resolveSlowNext(NEXT));
        const props = mockReadPostViewProps[mockReadPostViewProps.length - 1];
        expect(props.post).toBe(other);
        expect(props.next).toBe(otherNext);
        expect(props.prev).toBe(otherPrev);
    });

    it('records a page view for the post', () => {
        render(<SinglePostPage post={POST}/>);
        expect(mockAnalytics.firePageView).toHaveBeenCalledWith('3421');
    });

    it('puts the post\'s hero image behind the page', () => {
        const { getByTestId } = render(<SinglePostPage post={POST}/>);
        expect(getByTestId('mock-post-background')).toBeInTheDocument();
        expect(mockPostBackgroundProps[0].post).toBe(POST);
    });
});
