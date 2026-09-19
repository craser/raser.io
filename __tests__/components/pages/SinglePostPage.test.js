// ABOUTME: Guards the props SinglePostPage hands to ReadPostView for a single post.
// ABOUTME: A single post must render its full body with next/prev navigation.
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SinglePostPage from '@/components/pages/SinglePostPage';

const mockReadPostViewProps = [];

jest.mock('@/components/ReadPostView', () => {
    return function MockReadPostView(props) {
        mockReadPostViewProps.push(props);
        return <div data-testid="mock-read-post-view"/>;
    };
});

// SinglePostPage's pre-existing unused `Post` and `NextPrevPostLinks` imports (left alone per
// the task brief) pull in Post.module.scss and PostPreview.module.scss via the "@/" alias. Those
// aliased imports bypass the CSS mock and are compiled by real Sass, which cannot resolve the
// "@/" alias inside a stylesheet's own @import, so they must be mocked directly (see
// NextPrevPostLinks.test.js).
jest.mock('@/components/Post.module.scss', () => ({}));
jest.mock('@/components/PostPreview.module.scss', () => ({}));

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

jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: () => ({ firePageView: jest.fn(), fireReferrer: jest.fn() })
}));

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({
        getPostDao: () => ({
            getPostById: jest.fn().mockResolvedValue({ entryId: 'DUMMY_ENTRY_ID', title: 'DUMMY_TITLE' }),
            getNextPost: jest.fn().mockResolvedValue(null),
            getPrevPost: jest.fn().mockResolvedValue(null)
        })
    })
}));

describe('SinglePostPage', () => {
    beforeEach(() => {
        mockReadPostViewProps.length = 0;
    });

    it('renders the post once it loads', async () => {
        const { getByTestId } = render(<SinglePostPage postId="DUMMY_ENTRY_ID"/>);
        await waitFor(() => expect(getByTestId('mock-read-post-view')).toBeInTheDocument());
    });

    it('renders the full body with next/prev navigation', async () => {
        const { getByTestId } = render(<SinglePostPage postId="DUMMY_ENTRY_ID"/>);
        await waitFor(() => expect(getByTestId('mock-read-post-view')).toBeInTheDocument());
        expect(mockReadPostViewProps[0].showBody).toBe(true);
        expect(mockReadPostViewProps[0].showNextPrev).toBe(true);
    });
});
