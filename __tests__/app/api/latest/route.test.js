import { GET, LATEST_PATHNAME, MAX_CACHE_AGE, MAX_RESPONSE_TIME } from '@/app/api/latest/route'
import { get, list, del } from '@vercel/blob';
import PostDao from '@/model/PostDao';

jest.mock('@vercel/blob', () => ({
    list: jest.fn(),
    put: jest.fn(),
    del: jest.fn(),
}))

jest.mock('@/model/PostDao', () => ({
    PostDao: {
        getPostDao: jest.fn()
    }
}))

jest.mock('next/server', () => ({
    NextResponse: {
        json: (x) => x,
    }
}))


describe('endpoint to retrieve cached first page', () => {
    let fetch;

    beforeEach(() => {
        fetch = global.fetch;
        global.fetch = jest.fn();
        PostDao.getPostDao = jest.fn();
    })

    afterEach(() => {
        global.fetch = fetch;
        jest.resetAllMocks();
    })


    it('If no cached value exists, should wait for fresh value', async () => {
        list.mockReturnValue({
            blobs: [{ pathname: 'bogus' }]
        });
        PostDao.getPostDao.mockReturnValue({
            getEntries: async () => 'latest entries from dao'
        });

        const responseValue = await GET(); // JSON.stringify({ latest })
        expect(responseValue.latest).toBe('latest entries from dao');
    })

    it('If cache is fresh, return it', async () => {
        let now = new Date();
        let notYetStale = new Date(now.getTime() - (MAX_CACHE_AGE / 2));

        list.mockReturnValue({
            blobs: [{ pathname: LATEST_PATHNAME, uploadedAt: notYetStale.toString() }]
        });

        global.fetch.mockReturnValue({
            ok: true,
            json: async () => ({ latest: 'latest from blob' })
        });

        const responseValue = await GET();
        expect(responseValue.latest).toBe('latest from blob');
    });

    it('If the cache is stale, get a fresh value', async () => {
        let now = new Date();
        let staleDate = new Date(now.getTime() - (2 * MAX_CACHE_AGE));

        list.mockReturnValue({
            blobs: [{ pathname: LATEST_PATHNAME, uploadedAt: staleDate.toString() }]
        });

        global.fetch.mockReturnValue({
            ok: true,
            json: async () => ({ latest: 'latest from blob' })
        });

        PostDao.getPostDao.mockReturnValue({
            getEntries: async () => 'latest entries from dao'
        });

        const responseValue = await GET();
        expect(responseValue.latest).toBe('latest entries from dao');
    });

    it('Stale cache, but fresh request is prompt: return fresh value', async () => {
        let now = new Date();
        let staleDate = new Date(now.getTime() - (1.2 * MAX_CACHE_AGE));
        expect.assertions(1);

        list.mockReturnValue({
            blobs: [{
                pathname: LATEST_PATHNAME,
                uploadedAt: staleDate.toString(),
                downloadUrl: 'bogus url',
            }]
        });
        PostDao.getPostDao.mockReturnValue({
            getEntries: () => new Promise((resolve) => {
                setTimeout(() => {
                    resolve('latest entries from dao');
                }, MAX_RESPONSE_TIME - 100); // respond BEFORE timeout
            })
        });
        global.fetch.mockReturnValue({
            ok: true,
            json: async () => ({
                latest: 'latest from blob'
            })
        });

        const responseValue = await GET();
        expect(responseValue.latest).toBe('latest entries from dao');
    });

    /* This one is actually more complex:
     * if the cached value is stale, request a fresh value
     *     - if the fresh value arrives within 300ms, return that, then update the cache
     *     - if the fresh value takes more than 300ms, return the stale value, then update the cache
     *       when the fresh value arrives
     */
    it('Stale cache, but fresh request times out: return cached value', async () => {
        let now = new Date();
        let staleDate = new Date(now.getTime() - (1.2 * MAX_CACHE_AGE));

        list.mockReturnValue({
            blobs: [{
                pathname: LATEST_PATHNAME,
                uploadedAt: staleDate.toString(),
                downloadUrl: 'bogus url',
            }]
        });
        PostDao.getPostDao.mockReturnValue({
            getEntries: () => new Promise((resolve) => {
                setTimeout(() => {
                    resolve('latest entries from dao');
                }, MAX_RESPONSE_TIME + 100);
            })
        });
        global.fetch.mockReturnValue({
            ok: true,
            json: async () => ({
                latest: 'latest from blob'
            })
        });

        const responseValue = await GET();
        expect(responseValue.latest).toBe('latest from blob');
    });


})
