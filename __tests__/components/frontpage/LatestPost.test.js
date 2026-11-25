// ABOUTME: Tests that the hero post reserves its full box while loading, so the homepage doesn't reflow.
// ABOUTME: The skeleton shares the hero's layout class; the real post replaces it once fetched.

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LatestPostSection from '@/components/frontpage/LatestPost';

jest.mock('@/components/frontpage/LatestPost.module.scss', () => new Proxy({}, { get: (_, key) => key }));

jest.mock('lucide-react', () => ({ ChevronRight: () => <svg/> }));

jest.mock('@/components/PostLink', () => ({
    PostLink: ({ children }) => <a data-testid="post-link">{children}</a>
}));

jest.mock('@/components/PostTitle', () => ({
    __esModule: true,
    default: ({ post }) => <h3>{post.title}</h3>
}));

jest.mock('@/components/frontpage/PostedDate', () => ({ PostedDate: () => <span>date</span> }));
jest.mock('@/components/frontpage/EstimatedMinutesToRead', () => ({ EstimatedMinutesToRead: () => <span>5 min</span> }));
jest.mock('@/components/frontpage/PostBriefIntro', () => ({ PostBriefIntro: () => <p>brief</p> }));
jest.mock('@/components/frontpage/PreviewTitleImage', () => ({ getFrontPageTitleImageUrl: () => '/img/x.jpg' }));

const mockGetLatestPost = jest.fn();
jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({ getPostDao: () => ({ getLatestPost: mockGetLatestPost }) })
}));

describe('LatestPostSection', () => {
    beforeEach(() => mockGetLatestPost.mockReset());

    it('renders a skeleton in the hero box while the post loads', () => {
        mockGetLatestPost.mockReturnValue(new Promise(() => {}));
        render(<LatestPostSection/>);
        const skeleton = screen.getByTestId('latest-post-skeleton');
        expect(skeleton).toHaveClass('latestPost');
        expect(skeleton).toHaveAttribute('aria-busy', 'true');
        expect(screen.queryByTestId('post-link')).toBeNull();
    });

    it('replaces the skeleton with the post once it arrives', async () => {
        mockGetLatestPost.mockResolvedValue({ entryId: 1, title: 'Hello' });
        render(<LatestPostSection/>);
        await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());
        expect(screen.queryByTestId('latest-post-skeleton')).toBeNull();
    });

    it('shows a "continue" cue inside the hero link so it is clear there is more to read', async () => {
        mockGetLatestPost.mockResolvedValue({ entryId: 1, title: 'Hello' });
        render(<LatestPostSection/>);
        const cue = await screen.findByTestId('hero-continue');
        expect(cue).toHaveTextContent('continue');
        expect(screen.getByTestId('post-link')).toContainElement(cue);
    });
});
