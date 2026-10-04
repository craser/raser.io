/**
 * ABOUTME: Tests for the publisher's database writes: entry insert or update, attachments, tags, retry.
 * ABOUTME: Runs against the in-memory fakeDatabase; no real database.
 *
 * @jest-environment node
 */

import PostWriter from '@/lib/publish/PostWriter';
import PublishError from '@/lib/publish/PublishError';
import { fakeDatabase } from './support/fakeDatabase';

const record = (overrides = {}) => ({
    entryId: null,
    title: 'My Trip',
    intro: '<p>i</p>',
    body: null,
    datePosted: '2026-10-03 14:30:00',
    lastUpdated: '2026-10-03 14:31:07',
    imageFileName: 'hero.jpg',
    imageFileType: 1,
    viaUrl: null,
    viaTitle: null,
    viaText: null,
    userId: 1,
    userName: 'Chris',
    tags: [],
    attachments: [],
    ...overrides
});

const retryable = () => Object.assign(new Error('restart transaction'), { code: '40001' });
const count = (db, sql) => db.sql().filter(s => s === sql).length;
const paramsOf = (db, prefix) => db.statements.filter(s => s.sql.startsWith(prefix)).map(s => s.params);

describe('findEntry', () => {
    test('returns null when the entry does not exist', async () => {
        const db = fakeDatabase();

        expect(await new PostWriter({ pool: db.pool }).findEntry(9999)).toBeNull();
    });

    test("returns an existing entry's attachment file names", async () => {
        const db = fakeDatabase({ entries: { 3421: ['hero.jpg', 'route.pdf'] } });

        expect(await new PostWriter({ pool: db.pool }).findEntry(3421)).toEqual({
            entryId: 3421,
            attachmentNames: new Set(['hero.jpg', 'route.pdf'])
        });
    });
});

describe('nextEntryId', () => {
    test('is MAX(entry_id) + 1, read outside a transaction', async () => {
        const db = fakeDatabase({ maxEntryId: 3420 });

        expect(await new PostWriter({ pool: db.pool }).nextEntryId()).toBe(3421);
        expect(db.sql()).not.toContain('BEGIN');
    });
});

describe('write', () => {
    test('a new post gets MAX(entry_id) + 1 and is inserted inside a transaction', async () => {
        const db = fakeDatabase({ maxEntryId: 3420 });

        const entryId = await new PostWriter({ pool: db.pool }).write(record());

        expect(entryId).toBe(3421);
        expect(db.sql()[0]).toBe('BEGIN');
        expect(db.sql().at(-1)).toBe('COMMIT');
        expect(paramsOf(db, 'INSERT INTO blog_entries')).toEqual([[
            3421, 'My Trip', '<p>i</p>', null, '2026-10-03 14:30:00', '2026-10-03 14:31:07',
            'hero.jpg', 1, null, null, null, 1, 'Chris'
        ]]);
        expect(db.sql().some(s => s.startsWith('UPDATE'))).toBe(false);
    });

    test('an existing post is updated in place', async () => {
        const db = fakeDatabase({ entries: { 3421: [] } });

        const entryId = await new PostWriter({ pool: db.pool }).write(record({ entryId: 3421 }));

        expect(entryId).toBe(3421);
        expect(paramsOf(db, 'UPDATE blog_entries')).toEqual([[
            3421, 'My Trip', '<p>i</p>', null, '2026-10-03 14:30:00', '2026-10-03 14:31:07',
            'hero.jpg', 1, null, null, null
        ]]);
        expect(paramsOf(db, 'INSERT INTO blog_entries')).toEqual([]);
    });

    test('updating an entry that does not exist rolls back with a PublishError', async () => {
        const db = fakeDatabase();

        await expect(new PostWriter({ pool: db.pool }).write(record({ entryId: 3421 }))).rejects.toThrow(PublishError);
        expect(count(db, 'ROLLBACK')).toBe(1);
        expect(count(db, 'COMMIT')).toBe(0);
    });

    test("replaces the entry's attachments with freshly numbered rows", async () => {
        const db = fakeDatabase({ entries: { 3421: ['old.jpg'] }, maxAttachmentId: 2929 });

        await new PostWriter({ pool: db.pool }).write(record({
            entryId: 3421,
            attachments: [
                { fileName: 'hero.jpg', fileType: 'image', mimeType: 'image/jpeg', title: 'Halls Lake', description: 'Camp', isGallery: true },
                { fileName: 'route.pdf', fileType: 'document', mimeType: 'application/pdf', title: 'route.pdf', description: null, isGallery: false }
            ]
        }));

        const sql = db.sql();
        const deleteAt = sql.indexOf('DELETE FROM attachments WHERE entry_id = $1');
        const firstInsertAt = sql.findIndex(s => s.startsWith('INSERT INTO attachments'));
        expect(deleteAt).toBeGreaterThan(-1);
        expect(deleteAt).toBeLessThan(firstInsertAt);
        expect(paramsOf(db, 'DELETE FROM attachments')).toEqual([[3421]]);
        expect(paramsOf(db, 'INSERT INTO attachments')).toEqual([
            [2930, 3421, 'hero.jpg', 'image', 'image/jpeg', 'Halls Lake', 'Camp', 'true', '2026-10-03 14:30:00', 1, 'Chris'],
            [2931, 3421, 'route.pdf', 'document', 'application/pdf', 'route.pdf', null, 'false', '2026-10-03 14:30:00', 1, 'Chris']
        ]);
    });

    test('with no attachments, only clears the old rows', async () => {
        const db = fakeDatabase({ entries: { 3421: ['old.jpg'] } });

        await new PostWriter({ pool: db.pool }).write(record({ entryId: 3421 }));

        expect(paramsOf(db, 'DELETE FROM attachments')).toEqual([[3421]]);
        expect(db.sql().some(s => s.includes('MAX(attachment_id)'))).toBe(false);
    });

    test('reuses existing tags, creates missing ones, and replaces the tag links', async () => {
        const db = fakeDatabase({ entries: { 3421: [] }, tags: { bikes: 7 }, maxTagId: 40 });

        await new PostWriter({ pool: db.pool }).write(record({ entryId: 3421, tags: ['bikes', 'mtb'] }));

        expect(paramsOf(db, 'DELETE FROM tag_links')).toEqual([[3421]]);
        expect(paramsOf(db, 'INSERT INTO tags')).toEqual([[41, 'mtb']]);
        expect(paramsOf(db, 'INSERT INTO tag_links')).toEqual([[3421, 7], [3421, 41]]);
    });

    test('retries the whole transaction on a CockroachDB retry error', async () => {
        const db = fakeDatabase({ failures: [{ match: /^INSERT INTO blog_entries/, error: retryable() }] });

        const entryId = await new PostWriter({ pool: db.pool }).write(record());

        expect(entryId).toBe(3421);
        expect(count(db, 'BEGIN')).toBe(2);
        expect(count(db, 'ROLLBACK')).toBe(1);
        expect(count(db, 'COMMIT')).toBe(1);
        expect(db.releases()).toBe(2);
    });

    test('gives up after three attempts', async () => {
        const failures = [1, 2, 3].map(() => ({ match: /^INSERT INTO blog_entries/, error: retryable() }));
        const db = fakeDatabase({ failures });

        await expect(new PostWriter({ pool: db.pool }).write(record())).rejects.toMatchObject({ code: '40001' });
        expect(count(db, 'BEGIN')).toBe(3);
        expect(count(db, 'COMMIT')).toBe(0);
    });

    test('does not retry other errors', async () => {
        const db = fakeDatabase({ failures: [{ match: /^INSERT INTO blog_entries/, error: new Error('boom') }] });

        await expect(new PostWriter({ pool: db.pool }).write(record())).rejects.toThrow('boom');
        expect(count(db, 'BEGIN')).toBe(1);
        expect(db.releases()).toBe(1);
    });
});
