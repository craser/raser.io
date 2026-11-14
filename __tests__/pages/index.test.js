// ABOUTME: Tests the home page: it always uses the landing layout, and getStaticProps
// ABOUTME: reads the newest posts from the database and revalidates on the configured interval (ISR).

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home, { getStaticProps } from '@/pages/index';
import PostRepository from '@/lib/data/PostRepository';
import SiteConfig from '@/lib/SiteConfig';

const captured = {};

jest.mock('@/lib/data/PostRepository', () => {
    const repository = { getEntries: jest.fn() };
    return {
        __esModule: true,
        default: { getInstance: () => repository }
    };
});

jest.mock('@/components/templates/FrontLandingLayout', () => ({
    __esModule: true,
    default: ({ latest, github, listening, previous }) => <div data-testid="front-landing">{latest}{github}{listening}{previous}</div>
}));

jest.mock('@/components/frontpage/LatestPost', () => ({
    __esModule: true,
    default: (props) => {
        captured.latestPost = props;
        return <div data-testid="latest-post"/>;
    }
}));

jest.mock('@/components/frontpage/PreviousPosts', () => ({
    __esModule: true,
    default: (props) => {
        captured.previousPosts = props;
        return <div data-testid="previous-posts"/>;
    }
}));

jest.mock('@/components/github/GithubActivity', () => ({
    __esModule: true,
    default: () => <div data-testid="github-activity"/>
}));

jest.mock('@/components/spotify/RecentTracks', () => ({
    __esModule: true,
    default: () => <div data-testid="recent-tracks"/>
}));

jest.mock('@/components/flags/FeatureEnabled', () => ({
    __esModule: true,
    default: ({ feature, children }) => {
        captured.enabledFeatures = [...(captured.enabledFeatures ?? []), feature];
        return <div data-testid={`feature-enabled-${feature}`}>{children}</div>;
    }
}));

const post = (entryId) => ({ entryId, title: `Post ${entryId}` });

describe('Home page', () => {
    const repository = PostRepository.getInstance();

    beforeEach(() => {
        Object.keys(captured).forEach(k => delete captured[k]);
        repository.getEntries.mockReset();
    });

    describe('rendering', () => {
        it('always renders the landing layout', () => {
            const { getByTestId } = render(<Home latestPost={post(1)} recentPosts={[]}/>);
            expect(getByTestId('front-landing')).not.toBeNull();
        });

        it('does not gate the layout behind a feature flag', () => {
            render(<Home latestPost={post(1)} recentPosts={[]}/>);
            expect(captured.enabledFeatures).not.toContain('showLandingFrontpage');
        });

        it('hands the latest post to LatestPost', () => {
            render(<Home latestPost={post(1)} recentPosts={[]}/>);
            expect(captured.latestPost.initialPost).toEqual(post(1));
        });

        it('hands the recent posts to PreviousPosts', () => {
            const recentPosts = [post(2), post(3)];
            render(<Home latestPost={post(1)} recentPosts={recentPosts}/>);
            expect(captured.previousPosts.initialPosts).toEqual(recentPosts);
        });

        it('shows recent tracks only behind the showRecentTracks flag', () => {
            const { getByTestId } = render(<Home latestPost={post(1)} recentPosts={[]}/>);
            expect(captured.enabledFeatures).toContain('showRecentTracks');
            expect(getByTestId('feature-enabled-showRecentTracks')).toContainElement(getByTestId('recent-tracks'));
        });
    });

    describe('getStaticProps', () => {
        it('reads the six newest posts from the database', async () => {
            repository.getEntries.mockResolvedValue([]);
            await getStaticProps();
            expect(repository.getEntries).toHaveBeenCalledWith(0, 6);
        });

        it('splits the newest post from the five before it', async () => {
            const entries = [1, 2, 3, 4, 5, 6].map(post);
            repository.getEntries.mockResolvedValue(entries);
            const { props } = await getStaticProps();
            expect(props.latestPost).toEqual(post(1));
            expect(props.recentPosts).toEqual([2, 3, 4, 5, 6].map(post));
        });

        it('passes a null latest post when there are no posts', async () => {
            repository.getEntries.mockResolvedValue([]);
            const { props } = await getStaticProps();
            expect(props.latestPost).toBeNull();
            expect(props.recentPosts).toEqual([]);
        });

        it('revalidates on the configured interval', async () => {
            repository.getEntries.mockResolvedValue([]);
            const { revalidate } = await getStaticProps();
            expect(revalidate).toBe(new SiteConfig().getValue('staticGeneration.prerender.revalidateSeconds'));
            expect(revalidate).toBeGreaterThan(0);
        });

        it('lets a database failure propagate, so ISR keeps serving the last good page', async () => {
            repository.getEntries.mockRejectedValue(new Error('database down'));
            await expect(getStaticProps()).rejects.toThrow('database down');
        });
    });

    it('does not export getServerSideProps', () => {
        const page = require('@/pages/index');
        expect(page.getServerSideProps).toBeUndefined();
    });

    it('no longer renders the social feed placeholder', () => {
        expect(() => require('@/components/frontpage/SocialFeed')).toThrow();
    });
});
