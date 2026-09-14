/**
 * ABOUTME: Integration tests for the read-only /api/entries routes against the real database.
 * ABOUTME: Covers the URLs siteconfig.json declares and the JSON shape PostDao expects back.
 *
 * The environment pragma has to sit in this file's first docblock, so the ABOUTME
 * lines live here with it rather than in line comments above.
 *
 * @jest-environment node
 */

import { loadDatabaseEnv } from '../../../support/database-env';

loadDatabaseEnv();

// These tests query the real database over the network, so allow well beyond Jest's
// five second default to absorb connection setup and parallel query load.
jest.setTimeout(30000);

import Database from '@/lib/data/Database';
import { GET as getEntry } from '@/app/api/entries/[id]/route';
import { GET as getLatest } from '@/app/api/entries/latest/[page]/route';
import { GET as getNext } from '@/app/api/entries/[id]/next/route';
import { GET as getPrev } from '@/app/api/entries/[id]/prev/route';
import { GET as getSearch } from '@/app/api/entries/search/[numEntries]/route';

function request(url = 'http://localhost/api/entries') {
    return new Request(url);
}

afterAll(async () => {
    await Database.getInstance().close();
});

describe('GET /api/entries/[id]', () => {
    it('returns the requested post as JSON', async () => {
        const response = await getEntry(request(), { params: { id: '4' } });
        expect(response.status).toBe(200);
        const post = await response.json();
        expect(post.entryId).toBe(4);
        expect(post.title).toBe('Trip Report: Joshua Tree Climbing Trip');
    });

    it('includes nested attachments', async () => {
        const response = await getEntry(request(), { params: { id: '4' } });
        const post = await response.json();
        expect(post.attachments.length).toBeGreaterThan(0);
        expect(post.attachments[0]).toHaveProperty('fileName');
    });

    it('responds 404 for a post that does not exist', async () => {
        const response = await getEntry(request(), { params: { id: '99999999' } });
        expect(response.status).toBe(404);
    });

    it('responds 404 for a non-numeric id rather than failing', async () => {
        const response = await getEntry(request(), { params: { id: 'bogus' } });
        expect(response.status).toBe(404);
    });
});

describe('GET /api/entries/latest/[page]', () => {
    it('returns an array of posts', async () => {
        const response = await getLatest(request(), { params: { page: '0' } });
        expect(response.status).toBe(200);
        const posts = await response.json();
        expect(Array.isArray(posts)).toBe(true);
        expect(posts).toHaveLength(10);
    });

    it('honours the pageSize query parameter', async () => {
        const response = await getLatest(
            request('http://localhost/api/entries/latest/0?pageSize=3'),
            { params: { page: '0' } }
        );
        const posts = await response.json();
        expect(posts).toHaveLength(3);
    });

    it('supports pageSize=1, which is how getLatestPost reads the newest post', async () => {
        const response = await getLatest(
            request('http://localhost/api/entries/latest/0?pageSize=1'),
            { params: { page: '0' } }
        );
        const posts = await response.json();
        expect(posts).toHaveLength(1);
        expect(posts[0]).toHaveProperty('entryId');
    });

    it('returns distinct posts for successive pages', async () => {
        const first = await (await getLatest(
            request('http://localhost/api/entries/latest/0?pageSize=5'), { params: { page: '0' } }
        )).json();
        const second = await (await getLatest(
            request('http://localhost/api/entries/latest/1?pageSize=5'), { params: { page: '1' } }
        )).json();
        const overlap = first.map(p => p.entryId).filter(id => second.some(p => p.entryId === id));
        expect(overlap).toEqual([]);
    });

    it('falls back to page zero when the page is not a number', async () => {
        const response = await getLatest(request(), { params: { page: 'bogus' } });
        const posts = await response.json();
        const firstPage = await (await getLatest(request(), { params: { page: '0' } })).json();
        expect(posts.map(p => p.entryId)).toEqual(firstPage.map(p => p.entryId));
    });

    it('returns an empty array past the end of the data', async () => {
        const response = await getLatest(request(), { params: { page: '100000' } });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([]);
    });
});

describe('GET /api/entries/[id]/next', () => {
    it('returns the chronologically newer post', async () => {
        const response = await getNext(request(), { params: { id: '4' } });
        expect(response.status).toBe(200);
        const post = await response.json();
        expect(post.entryId).toBeGreaterThan(0);
        expect(post.datePosted >= '2003-12-11').toBe(true);
    });

    it('responds 404 at the newest post', async () => {
        const [newest] = await (await getLatest(
            request('http://localhost/api/entries/latest/0?pageSize=1'), { params: { page: '0' } }
        )).json();
        const response = await getNext(request(), { params: { id: String(newest.entryId) } });
        expect(response.status).toBe(404);
    });

    it('responds 404 for an unknown id', async () => {
        const response = await getNext(request(), { params: { id: '99999999' } });
        expect(response.status).toBe(404);
    });
});

describe('GET /api/entries/[id]/prev', () => {
    it('returns the chronologically older post', async () => {
        const response = await getPrev(request(), { params: { id: '5' } });
        expect(response.status).toBe(200);
        const post = await response.json();
        expect(post).toHaveProperty('entryId');
    });

    it('round-trips with next', async () => {
        const prev = await (await getPrev(request(), { params: { id: '5' } })).json();
        const back = await (await getNext(request(), { params: { id: String(prev.entryId) } })).json();
        expect(back.entryId).toBe(5);
    });

    it('responds 404 for an unknown id', async () => {
        const response = await getPrev(request(), { params: { id: '99999999' } });
        expect(response.status).toBe(404);
    });
});

describe('GET /api/entries/search/[numEntries]', () => {
    it('returns the requested number of stubs', async () => {
        const response = await getSearch(request(), { params: { numEntries: '25' } });
        expect(response.status).toBe(200);
        const stubs = await response.json();
        expect(stubs).toHaveLength(25);
    });

    it('returns stubs carrying the fields the search index reads', async () => {
        const stubs = await (await getSearch(request(), { params: { numEntries: '1' } })).json();
        expect(stubs[0]).toHaveProperty('entryId');
        expect(stubs[0]).toHaveProperty('title');
        expect(stubs[0]).toHaveProperty('intro');
        expect(stubs[0]).toHaveProperty('body');
    });

    it('falls back to a default count when the parameter is not a number', async () => {
        const response = await getSearch(request(), { params: { numEntries: 'bogus' } });
        expect(response.status).toBe(200);
        expect((await response.json()).length).toBeGreaterThan(0);
    });
});
