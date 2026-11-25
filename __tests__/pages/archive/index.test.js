// ABOUTME: Tests the archive index: getStaticProps reads the first page of posts from the database and
// ABOUTME: revalidates on the configured interval (ISR), and the page hands that page to LogEntries.

import { render } from '@testing-library/react';
import Archive, { getStaticProps } from '@/pages/archive/index';
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

const post = (entryId) => ({ entryId, title: `Post ${entryId}`, body: null });
const config = new SiteConfig();
const pageSize = config.getValue('staticGeneration.prerender.archiveEntries');

describe('Archive index page', () => {
    const repository = PostRepository.getInstance();

    beforeEach(() => {
        Object.keys(captured).forEach(k => delete captured[k]);
        repository.getEntries.mockReset();
    });

    describe('rendering', () => {
        it('renders the list of entries', () => {
            const { getByTestId } = render(<Archive initialEntries={[post(1)]}/>);
            expect(getByTestId('log-entries')).not.toBeNull();
        });

        it('hands the prerendered entries to LogEntries', () => {
            const initialEntries = [post(2), post(1)];
            render(<Archive initialEntries={initialEntries}/>);
            expect(captured.logEntries.initialEntries).toEqual(initialEntries);
        });

        it('has LogEntries load from the second page, since the first is already rendered', () => {
            render(<Archive initialEntries={[post(1)]}/>);
            expect(captured.logEntries.initialPage).toBe(1);
        });

        it('pages through the archive in pages the size of the prerendered one', () => {
            render(<Archive initialEntries={[post(1)]}/>);
            expect(captured.logEntries.pageSize).toBe(pageSize);
        });
    });

    describe('getStaticProps', () => {
        it('reads the first page of posts from the database', async () => {
            repository.getEntries.mockResolvedValue([]);
            await getStaticProps();
            expect(repository.getEntries).toHaveBeenCalledWith(0, pageSize);
        });

        it('passes the posts to the page', async () => {
            const entries = [post(3), post(2), post(1)];
            repository.getEntries.mockResolvedValue(entries);
            const { props } = await getStaticProps();
            expect(props.initialEntries).toEqual(entries);
        });

        it('leaves the bodies out of the posts, since the archive shows only intros', async () => {
            repository.getEntries.mockResolvedValue([{ ...post(2), body: 'BODY' }, { ...post(1), body: 'BODY' }]);
            const { props } = await getStaticProps();
            expect(props.initialEntries).toEqual([{ ...post(2), body: null }, { ...post(1), body: null }]);
        });

        it('revalidates on the configured interval', async () => {
            repository.getEntries.mockResolvedValue([]);
            const { revalidate } = await getStaticProps();
            expect(revalidate).toBe(config.getValue('staticGeneration.prerender.revalidateSeconds'));
            expect(revalidate).toBeGreaterThan(0);
        });

        it('lets a database failure propagate, so ISR keeps serving the last good page', async () => {
            repository.getEntries.mockRejectedValue(new Error('database down'));
            await expect(getStaticProps()).rejects.toThrow('database down');
        });
    });

    it('does not export getServerSideProps', () => {
        const page = require('@/pages/archive/index');
        expect(page.getServerSideProps).toBeUndefined();
    });
});
