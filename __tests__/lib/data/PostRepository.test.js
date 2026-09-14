/**
 * ABOUTME: Integration tests for PostRepository against the real database.
 * ABOUTME: Asserts the JSON shape matches what the old API returned, using data/posts.json as the reference.
 *
 * The environment pragma has to sit in this file's first docblock, so the ABOUTME
 * lines live here with it rather than in line comments above.
 *
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { loadDatabaseEnv } from '../../support/database-env';

loadDatabaseEnv();

// These tests query the real database over the network. Fetching the whole data set
// takes a couple of seconds on its own, and longer while the route tests are querying
// in parallel, so allow well beyond Jest's five second default.
jest.setTimeout(30000);

import PostRepository from '@/lib/data/PostRepository';
import Database from '@/lib/data/Database';

/**
 * data/posts.json is the reference for the shape the API returns, but two fields in it
 * disagree with the database. The repository reports what the database holds, so those
 * fields are reconciled to the stored values before they are used as expectations.
 *
 *  - entry 4 body: posts.json has a stray "asdf" typed into "little"; the database is correct.
 *  - entry 2655 datePosted: posts.json corrects the year to 2012, but the database still
 *    holds the 0012 from the dump.
 *
 * Correcting entry 2655 in the database would let its entry be removed.
 */
const STORED_VALUES = {
    4: { body: body => body.replace('littasdfle', 'little') },
    2655: { datePosted: () => '0012-04-25 08:16:43.000000' },
};

const reference = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'posts.json'), 'utf-8'))
    .map(post => {
        const overrides = STORED_VALUES[post.entryId];
        if (!overrides) {
            return post;
        }
        const reconciled = { ...post };
        Object.entries(overrides).forEach(([field, toStored]) => {
            reconciled[field] = toStored(post[field]);
        });
        return reconciled;
    });

const referenceById = new Map(reference.map(p => [p.entryId, p]));

/**
 * Newest first, ties broken by ascending entryId.
 *
 * The timestamps are compared as strings rather than through Date. The format is
 * fixed-width, so string order is chronological order - and Date misreads the year-0012
 * value on entry 2655, parsing it as a date in the current century.
 */
const referenceOrder = [...reference].sort((a, b) => {
    if (a.datePosted !== b.datePosted) {
        return a.datePosted < b.datePosted ? 1 : -1;
    }
    return a.entryId - b.entryId;
});

const IMAGE_FILE_TYPES = { 0: 'map', 1: 'image', 2: 'document' };

/**
 * The reference file stores imageFileType as the raw numeric column value. The API
 * reports the name, so translate before comparing.
 */
function expectedPost(entryId) {
    const post = referenceById.get(entryId);
    return {
        ...post,
        imageFileType: IMAGE_FILE_TYPES[post.imageFileType] ?? post.imageFileType,
    };
}

describe('PostRepository', () => {
    let repository;

    beforeAll(() => {
        repository = PostRepository.getInstance();
    });

    afterAll(async () => {
        await Database.getInstance().close();
    });

    describe('getPostById', () => {
        it('returns the post with every field the old API returned', async () => {
            const post = await repository.getPostById(4);
            expect(post).toEqual(expectedPost(4));
        });

        it('accepts a string id', async () => {
            const post = await repository.getPostById('4');
            expect(post.entryId).toBe(4);
        });

        it('reports imageFileType by name rather than number', async () => {
            const post = await repository.getPostById(4);
            expect(post.imageFileType).toBe('image');
        });

        it('returns null imageFileType when the column is null', async () => {
            const post = await repository.getPostById(3420);
            expect(post.imageFileType).toBeNull();
        });

        it('nests attachments in ascending attachmentId order', async () => {
            const post = await repository.getPostById(4);
            const ids = post.attachments.map(a => a.attachmentId);
            expect(ids).toEqual([...ids].sort((a, b) => a - b));
            expect(ids).toEqual(expectedPost(4).attachments.map(a => a.attachmentId));
        });

        it('returns an empty attachments array for a post with none', async () => {
            const bare = reference.find(p => !p.attachments || p.attachments.length === 0);
            const post = await repository.getPostById(bare.entryId);
            expect(post.attachments).toEqual([]);
        });

        it('preserves CRLF line endings in body text', async () => {
            const post = await repository.getPostById(6);
            expect(post.intro).toContain('\r\n');
            expect(post.intro).toEqual(expectedPost(6).intro);
        });

        it('formats dates the way the reference data does', async () => {
            const post = await repository.getPostById(4);
            expect(post.datePosted).toBe('2003-12-11 00:00:00.000000');
        });

        it('returns null for an unknown id', async () => {
            expect(await repository.getPostById(99999999)).toBeNull();
        });

        it('returns null for a non-numeric id', async () => {
            expect(await repository.getPostById('not-a-number')).toBeNull();
        });
    });

    describe('getEntries', () => {
        it('returns a page of posts newest first', async () => {
            const posts = await repository.getEntries(0, 10);
            expect(posts.map(p => p.entryId)).toEqual(referenceOrder.slice(0, 10).map(p => p.entryId));
        });

        it('honours page and pageSize', async () => {
            const posts = await repository.getEntries(2, 5);
            expect(posts.map(p => p.entryId)).toEqual(referenceOrder.slice(10, 15).map(p => p.entryId));
        });

        it('defaults to the first page of ten', async () => {
            const posts = await repository.getEntries();
            expect(posts).toHaveLength(10);
            expect(posts[0].entryId).toBe(referenceOrder[0].entryId);
        });

        it('supports a page size of one, as getLatestPost uses', async () => {
            const posts = await repository.getEntries(0, 1);
            expect(posts).toHaveLength(1);
            expect(posts[0]).toEqual(expectedPost(referenceOrder[0].entryId));
        });

        it('returns an empty array past the end of the data', async () => {
            expect(await repository.getEntries(100000, 10)).toEqual([]);
        });

        it('carries attachments on every post in the page', async () => {
            const posts = await repository.getEntries(0, 10);
            posts.forEach(p => expect(Array.isArray(p.attachments)).toBe(true));
        });
    });

    describe('getNextPost', () => {
        it('returns the chronologically newer neighbour', async () => {
            const index = referenceOrder.findIndex(p => p.entryId === 4);
            const expected = referenceOrder[index - 1];
            const next = await repository.getNextPost(4);
            expect(next.entryId).toBe(expected.entryId);
        });

        it('breaks ties on date by ascending entryId', async () => {
            // Entries 48..51 all share the timestamp 2004-07-06 00:00:00.
            const next = await repository.getNextPost(49);
            expect(next.entryId).toBe(48);
        });

        it('returns null for the newest post', async () => {
            expect(await repository.getNextPost(referenceOrder[0].entryId)).toBeNull();
        });

        it('returns null for an unknown id', async () => {
            expect(await repository.getNextPost(99999999)).toBeNull();
        });
    });

    describe('getPrevPost', () => {
        it('returns the chronologically older neighbour', async () => {
            const index = referenceOrder.findIndex(p => p.entryId === 4);
            const expected = referenceOrder[index + 1];
            const prev = await repository.getPrevPost(4);
            expect(prev.entryId).toBe(expected.entryId);
        });

        it('breaks ties on date by ascending entryId', async () => {
            const prev = await repository.getPrevPost(49);
            expect(prev.entryId).toBe(50);
        });

        it('returns null for the oldest post', async () => {
            const oldest = referenceOrder[referenceOrder.length - 1];
            expect(await repository.getPrevPost(oldest.entryId)).toBeNull();
        });

        it('returns null for an unknown id', async () => {
            expect(await repository.getPrevPost(99999999)).toBeNull();
        });
    });

    describe('getSearchStubs', () => {
        it('returns the requested number of posts newest first', async () => {
            const stubs = await repository.getSearchStubs(25);
            expect(stubs).toHaveLength(25);
            expect(stubs.map(p => p.entryId)).toEqual(referenceOrder.slice(0, 25).map(p => p.entryId));
        });

        it('carries the fields the search index reads', async () => {
            const [stub] = await repository.getSearchStubs(1);
            expect(stub).toEqual(expect.objectContaining({
                entryId: expect.any(Number),
                title: expect.any(String),
            }));
            expect(stub).toHaveProperty('intro');
            expect(stub).toHaveProperty('body');
        });

        it('returns every post when asked for more than exist', async () => {
            const stubs = await repository.getSearchStubs(100000);
            expect(stubs).toHaveLength(reference.length);
        });
    });
});
