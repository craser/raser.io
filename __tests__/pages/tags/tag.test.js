// ABOUTME: Tests that the tag listing page lists a tag's posts the way the archive lists all posts:
// ABOUTME: getStaticPaths/getStaticProps read the tag's first page from the database with ISR, rendered on first request.

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TagPage, { getStaticPaths, getStaticProps } from '@/pages/tags/[tag]';
import PostRepository from '@/lib/data/PostRepository';
import SiteConfig from '@/lib/SiteConfig';

const captured = {};

jest.mock('@/lib/data/PostRepository', () => {
    const repository = { getEntriesByTag: jest.fn() };
    return {
        __esModule: true,
        default: { getInstance: () => repository }
    };
});

jest.mock('@/components/templates/StandardLayout', () => ({
    __esModule: true,
    default: ({ content }) => <div data-testid="standard-layout">{content}</div>
}));

jest.mock('@/components/templates/SingleSectionContent', () => ({
    __esModule: true,
    default: ({ content }) => <div data-testid="single-section">{content}</div>
}));

jest.mock('@/components/LogEntries', () => ({
    __esModule: true,
    default: (props) => {
        captured.logEntries = props;
        return <div data-testid="log-entries"/>;
    }
}));

// next/head writes to the document head as a side effect; render its children inline instead.
jest.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="head">{children}</div>
}));

const post = (entryId) => ({ entryId, title: `Post ${entryId}` });
const config = new SiteConfig();
const pageSize = config.getValue('staticGeneration.prerender.archiveEntries');

describe('Tag listing page', () => {
    const repository = PostRepository.getInstance();

    beforeEach(() => {
        Object.keys(captured).forEach(k => delete captured[k]);
        repository.getEntriesByTag.mockReset();
    });

    describe('rendering', () => {
        it('lists the tag\'s posts with the archive\'s layout and page size', () => {
            const { getByTestId } = render(<TagPage tag="joshuatree" initialEntries={[post(1)]}/>);
            expect(getByTestId('standard-layout')).toContainElement(getByTestId('log-entries'));
            expect(captured.logEntries.tag).toBe('joshuatree');
            expect(captured.logEntries.pageSize).toBe(pageSize);
        });

        it('hands the prerendered posts to LogEntries, which loads from the second page', () => {
            const initialEntries = [post(2), post(1)];
            render(<TagPage tag="joshuatree" initialEntries={initialEntries}/>);
            expect(captured.logEntries.initialEntries).toEqual(initialEntries);
            expect(captured.logEntries.initialPage).toBe(1);
        });

        it('names the tag in a heading above the list', () => {
            const { getByRole } = render(<TagPage tag="joshuatree" initialEntries={[]}/>);
            expect(getByRole('heading', { name: 'Posts tagged joshuatree' })).toBeInTheDocument();
        });

        it('names the tag in the page title', () => {
            const { getByTestId } = render(<TagPage tag="joshuatree" initialEntries={[]}/>);
            expect(getByTestId('head').querySelector('title').textContent).toBe('Posts tagged joshuatree - DeathB4Decaf');
        });
    });

    describe('getStaticPaths', () => {
        it('prerenders no tags at build time', async () => {
            const { paths } = await getStaticPaths();
            expect(paths).toEqual([]);
        });

        it('renders each tag on its first request, without a loading state', async () => {
            const { fallback } = await getStaticPaths();
            expect(fallback).toBe('blocking');
        });
    });

    describe('getStaticProps', () => {
        it('reads the first page of the tag\'s posts from the database', async () => {
            repository.getEntriesByTag.mockResolvedValue([]);
            await getStaticProps({ params: { tag: 'joshuatree' } });
            expect(repository.getEntriesByTag).toHaveBeenCalledWith('joshuatree', 0, pageSize);
        });

        it('passes the tag and its posts to the page', async () => {
            const entries = [post(2), post(1)];
            repository.getEntriesByTag.mockResolvedValue(entries);
            const { props } = await getStaticProps({ params: { tag: 'joshuatree' } });
            expect(props.tag).toBe('joshuatree');
            expect(props.initialEntries).toEqual(entries);
        });

        it('revalidates on the configured interval', async () => {
            repository.getEntriesByTag.mockResolvedValue([]);
            const { revalidate } = await getStaticProps({ params: { tag: 'joshuatree' } });
            expect(revalidate).toBe(config.getValue('staticGeneration.prerender.revalidateSeconds'));
            expect(revalidate).toBeGreaterThan(0);
        });

        it('lets a database failure propagate, so ISR keeps serving the last good page', async () => {
            repository.getEntriesByTag.mockRejectedValue(new Error('database down'));
            await expect(getStaticProps({ params: { tag: 'joshuatree' } })).rejects.toThrow('database down');
        });
    });

    it('does not export getServerSideProps', () => {
        const page = require('@/pages/tags/[tag]');
        expect(page.getServerSideProps).toBeUndefined();
    });
});
