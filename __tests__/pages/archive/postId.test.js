// ABOUTME: Tests the single-post page: getStaticPaths/getStaticProps read posts from the database and
// ABOUTME: revalidate on the configured interval (ISR), and the page hands the post to SinglePostPage.

import { render } from '@testing-library/react';
import PostIdParamPage, { getStaticPaths, getStaticProps } from '@/pages/archive/[postId]';
import PostRepository from '@/lib/data/PostRepository';
import SiteConfig from '@/lib/SiteConfig';

const captured = {};

jest.mock('@/lib/data/PostRepository', () => {
    const repository = { getEntries: jest.fn(), getPostById: jest.fn() };
    return {
        __esModule: true,
        default: { getInstance: () => repository }
    };
});

jest.mock('@/components/pages/SinglePostPage', () => ({
    __esModule: true,
    default: (props) => {
        captured.singlePostPage = props;
        return <div data-testid="single-post-page"/>;
    }
}));

const post = (entryId) => ({ entryId, title: `Post ${entryId}` });
const config = new SiteConfig();

describe('Single post page', () => {
    const repository = PostRepository.getInstance();

    beforeEach(() => {
        Object.keys(captured).forEach(k => delete captured[k]);
        repository.getEntries.mockReset();
        repository.getPostById.mockReset();
    });

    describe('rendering', () => {
        it('hands the post to SinglePostPage', () => {
            const { getByTestId } = render(<PostIdParamPage post={post(4)}/>);
            expect(getByTestId('single-post-page')).not.toBeNull();
            expect(captured.singlePostPage.post).toEqual(post(4));
        });
    });

    describe('getStaticPaths', () => {
        it('prerenders the configured number of newest posts', async () => {
            repository.getEntries.mockResolvedValue([]);
            await getStaticPaths();
            expect(repository.getEntries).toHaveBeenCalledWith(0, config.getValue('staticGeneration.prerender.posts'));
        });

        it('builds a path for each post from its entry id', async () => {
            repository.getEntries.mockResolvedValue([post(3421), post(3420)]);
            const { paths } = await getStaticPaths();
            expect(paths).toEqual([
                { params: { postId: '3421' } },
                { params: { postId: '3420' } }
            ]);
        });

        it('renders posts outside the prerendered set on first request, without a loading state', async () => {
            repository.getEntries.mockResolvedValue([]);
            const { fallback } = await getStaticPaths();
            expect(fallback).toBe('blocking');
        });
    });

    describe('getStaticProps', () => {
        it('reads the post named in the path from the database', async () => {
            repository.getPostById.mockResolvedValue(post(3421));
            const { props } = await getStaticProps({ params: { postId: '3421' } });
            expect(repository.getPostById).toHaveBeenCalledWith('3421');
            expect(props.post).toEqual(post(3421));
        });

        it('revalidates on the configured interval', async () => {
            repository.getPostById.mockResolvedValue(post(3421));
            const { revalidate } = await getStaticProps({ params: { postId: '3421' } });
            expect(revalidate).toBe(config.getValue('staticGeneration.prerender.revalidateSeconds'));
            expect(revalidate).toBeGreaterThan(0);
        });

        it('returns not found for a post that does not exist, and checks again on the same interval', async () => {
            repository.getPostById.mockResolvedValue(null);
            const result = await getStaticProps({ params: { postId: '999999' } });
            expect(result.notFound).toBe(true);
            expect(result.props).toBeUndefined();
            expect(result.revalidate).toBe(config.getValue('staticGeneration.prerender.revalidateSeconds'));
        });

        it('lets a database failure propagate, so ISR keeps serving the last good page', async () => {
            repository.getPostById.mockRejectedValue(new Error('database down'));
            await expect(getStaticProps({ params: { postId: '3421' } })).rejects.toThrow('database down');
        });
    });

    it('does not export getServerSideProps', () => {
        const page = require('@/pages/archive/[postId]');
        expect(page.getServerSideProps).toBeUndefined();
    });
});
