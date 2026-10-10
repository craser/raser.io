// ABOUTME: Tests that PostDao builds the right API URLs for its requests.
// ABOUTME: fetch is stubbed, so these run without a server or database.

import PostDao from '@/model/PostDao';

jest.mock('/siteconfig.json', () => ({
    api: {
        root: '{NEXT_PUBLIC_API_ROOT}',
        endpoints: {
            entries: {
                tagged: '/entries/tagged/{tag}/{page}?pageSize={pageSize}'
            }
        }
    }
}));

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
});
