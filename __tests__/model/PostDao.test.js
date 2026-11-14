// ABOUTME: Tests that PostDao builds the right API URLs for its requests and reports fetch failures.
// ABOUTME: fetch is stubbed, so these run without a server or database.

import PostDao from '@/model/PostDao';

jest.mock('/siteconfig.json', () => ({
    api: {
        root: '{NEXT_PUBLIC_API_ROOT}',
        endpoints: {
            entries: {
                entry: '/entries/{id}',
                latest: '/entries/latest/{page}?pageSize={pageSize}',
                next: '/entries/{id}/next',
                previous: '/entries/{id}/prev',
                bulk: '/entries/search/{numEntries}',
                tagged: '/entries/tagged/{tag}/{page}?pageSize={pageSize}'
            }
        }
    }
}));

function respondWithStatus(status) {
    global.fetch = jest.fn(async () => ({ ok: false, status, json: async () => null }));
}

describe('PostDao', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_ROOT = 'http://dummyhost.com/api';
        global.fetch = jest.fn(async () => ({ ok: true, json: async () => [{ entryId: 4 }] }));
    });

    describe('getEntriesByTag', () => {
        it('fetches the requested page of posts with that tag', async () => {
            const posts = await new PostDao().getEntriesByTag('joshuatree', 2, 30);
            expect(global.fetch.mock.calls[0][0]).toBe('http://dummyhost.com/api/entries/tagged/joshuatree/2?pageSize=30');
            expect(posts).toEqual([{ entryId: 4 }]);
        });

        it('URL-encodes the tag', async () => {
            await new PostDao().getEntriesByTag('at&t 9/11', 0, 30);
            expect(global.fetch.mock.calls[0][0]).toBe('http://dummyhost.com/api/entries/tagged/at%26t%209%2F11/0?pageSize=30');
        });

        it('defaults to the first page of ten', async () => {
            await new PostDao().getEntriesByTag('joshuatree');
            expect(global.fetch.mock.calls[0][0]).toBe('http://dummyhost.com/api/entries/tagged/joshuatree/0?pageSize=10');
        });
    });

    describe.each([
        ['getNextPost', 'http://dummyhost.com/api/entries/7/next'],
        ['getPrevPost', 'http://dummyhost.com/api/entries/7/prev'],
    ])('%s', (method, url) => {
        it('resolves to the neighbouring post', async () => {
            global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ entryId: 8 }) }));
            const post = await new PostDao()[method]({ entryId: 7 });
            expect(global.fetch.mock.calls[0][0]).toBe(url);
            expect(post).toEqual({ entryId: 8 });
        });

        it('resolves to null when there is no neighbouring post (404)', async () => {
            respondWithStatus(404);
            await expect(new PostDao()[method]({ entryId: 7 })).resolves.toBeNull();
        });

        it('rejects with the HTTP status on a server error', async () => {
            respondWithStatus(500);
            await expect(new PostDao()[method]({ entryId: 7 })).rejects.toThrow('HTTP error! status: 500');
        });

        it('rejects with the network error when the fetch fails', async () => {
            global.fetch = jest.fn(async () => { throw new TypeError('Failed to fetch'); });
            await expect(new PostDao()[method]({ entryId: 7 })).rejects.toThrow('Failed to fetch');
        });
    });

    describe.each([
        ['getLatestPost', []],
        ['getPostById', [7]],
        ['getEntries', [0, 10]],
        ['getEntriesByTag', ['joshuatree', 0, 10]],
        ['getSearchStubs', [1000]],
    ])('%s', (method, args) => {
        it('rejects with the HTTP status when the post is not found', async () => {
            respondWithStatus(404);
            await expect(new PostDao()[method](...args)).rejects.toThrow('HTTP error! status: 404');
        });

        it('rejects with the HTTP status on a server error', async () => {
            respondWithStatus(500);
            await expect(new PostDao()[method](...args)).rejects.toThrow('HTTP error! status: 500');
        });

        it('rejects with the network error when the fetch fails', async () => {
            global.fetch = jest.fn(async () => { throw new TypeError('Failed to fetch'); });
            await expect(new PostDao()[method](...args)).rejects.toThrow('Failed to fetch');
        });
    });
});
