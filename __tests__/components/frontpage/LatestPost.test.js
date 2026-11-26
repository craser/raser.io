// ABOUTME: Tests that the hero post reserves its full box while loading, so the homepage doesn't reflow.
// ABOUTME: The skeleton shares the hero's layout class; the real post replaces it once fetched, over a resized, preloaded image.

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
const mockHeroUrl = jest.fn();
jest.mock('@/components/frontpage/PreviewTitleImage', () => ({ getFrontPageTitleImageUrl: (post) => mockHeroUrl(post) }));

const mockGetLatestPost = jest.fn();
jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({ getPostDao: () => ({ getLatestPost: mockGetLatestPost }) })
}));

describe('LatestPostSection', () => {
    beforeEach(() => {
        mockGetLatestPost.mockReset();
        mockHeroUrl.mockReset().mockReturnValue('/img/x.jpg');
    });

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

    it('draws a CDN hero through the image optimizer, sized to the full width', async () => {
        const src = 'https://raserio.b-cdn.net/hero.jpg';
        mockHeroUrl.mockReturnValue(src);
        render(<LatestPostSection initialPost={{ entryId: 1, title: 'Hello' }}/>);
        const img = screen.getByTestId('hero-image');
        expect(img.getAttribute('src')).toMatch(/\/_next\/image\?url=/);
        expect(img.getAttribute('src')).toContain(encodeURIComponent(src));
        expect(img).toHaveAttribute('sizes', '100vw');
        expect(img).toHaveAttribute('alt', '');
        expect(screen.getByTestId('post-link')).toContainElement(img);
    });

    it('loads the hero eagerly, since it is the first thing on the page', () => {
        mockHeroUrl.mockReturnValue('https://raserio.b-cdn.net/hero.jpg');
        render(<LatestPostSection initialPost={{ entryId: 1, title: 'Hello' }}/>);
        expect(screen.getByTestId('hero-image')).not.toHaveAttribute('loading', 'lazy');
    });

    it('serves a YouTube thumbnail hero as-is', () => {
        const src = 'https://i.ytimg.com/vi/abc/hqdefault.jpg';
        mockHeroUrl.mockReturnValue(src);
        render(<LatestPostSection initialPost={{ entryId: 1, title: 'Hello' }}/>);
        expect(screen.getByTestId('hero-image')).toHaveAttribute('src', src);
    });

    it.each([
        ['a post with no image', null],
        ['a map post, whose URL is GPX data rather than an image', 'https://raserio.b-cdn.net/ride.gpx'],
    ])('draws no hero image for %s', (_, src) => {
        mockHeroUrl.mockReturnValue(src);
        render(<LatestPostSection initialPost={{ entryId: 1, title: 'Hello' }}/>);
        expect(screen.queryByTestId('hero-image')).toBeNull();
    });
});
