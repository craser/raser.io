/**
 * ABOUTME: Tests for deleting a post: find it, refuse when it has comments, confirm, delete, reset post.json, purge files.
 * ABOUTME: Real temporary post folders, with in-memory fakes for the CDN and the database writer.
 *
 * @jest-environment node
 */

import fs from 'node:fs';
import path from 'node:path';
import Deleter from '@/lib/publish/Deleter';
import PublishError from '@/lib/publish/PublishError';
import { makePostFolder, removeFolder } from './support/postFixture';

const ENTRY = { entryId: 3421, title: 'My Trip', datePosted: '2026-10-03 14:30', commentCount: 0, fileNames: ['hero.jpg', 'route.pdf'] };

function fakeWriter({ entry = ENTRY, shared = [] } = {}) {
    return {
        deleted: [],
        async findEntryForDeletion(entryId) {
            return entry && entry.entryId === entryId ? entry : null;
        },
        async sharedFileNames() {
            return new Set(shared);
        },
        async deleteEntry(entryId) {
            this.deleted.push(entryId);
        }
    };
}

function fakeCdn() {
    return {
        deleted: [],
        async delete(name) {
            this.deleted.push(name);
        }
    };
}

function setup({ writer = fakeWriter(), cdn = fakeCdn(), answer = true } = {}) {
    const log = [];
    const confirm = jest.fn(async () => answer);
    const deleter = new Deleter({ cdn, writer, confirm, log: line => log.push(line) });
    return { deleter, writer, cdn, confirm, log };
}

const readPost = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8'));

let dir;

afterEach(() => {
    if (dir) {
        removeFolder(dir);
        dir = null;
    }
});

test('deletes an entry by ID after confirming, leaving CDN files in place', async () => {
    const { deleter, writer, cdn, confirm, log } = setup();

    const result = await deleter.delete({ entryId: 3421 });

    expect(confirm).toHaveBeenCalledWith('Delete entry 3421 "My Trip"?');
    expect(writer.deleted).toEqual([3421]);
    expect(cdn.deleted).toEqual([]);
    expect(result).toEqual({ status: 'deleted', entryId: 3421, purged: [] });
    expect(log.join('\n')).toContain('CDN files stay in place (pass --purge-files to delete them)');
});

test('deleting by folder uses its entryId and resets entryId and datePosted in post.json', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', datePosted: '2026-10-03 14:30', _note: 'kept', entryId: 3421 } });
    const { deleter, writer } = setup();

    await deleter.delete({ dir });

    expect(writer.deleted).toEqual([3421]);
    expect(readPost(dir)).toEqual({ title: 'My Trip', datePosted: null, _note: 'kept', entryId: null });
});

test('a folder whose post.json has no entryId is refused', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', entryId: null } });
    const { deleter, writer } = setup();

    await expect(deleter.delete({ dir })).rejects.toThrow(/no entryId/);
    expect(writer.deleted).toEqual([]);
});

test('an entry that does not exist is refused', async () => {
    const { deleter, writer } = setup({ writer: fakeWriter({ entry: null }) });

    await expect(deleter.delete({ entryId: 9999 })).rejects.toThrow(/no entry 9999/);
    expect(writer.deleted).toEqual([]);
});

test('an entry with comments is refused, naming how many', async () => {
    const { deleter, writer, confirm } = setup({ writer: fakeWriter({ entry: { ...ENTRY, commentCount: 12 } }) });

    await expect(deleter.delete({ entryId: 3421 })).rejects.toThrow(/12 comments/);
    expect(confirm).not.toHaveBeenCalled();
    expect(writer.deleted).toEqual([]);
});

test('a dry run deletes nothing and does not ask', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', datePosted: '2026-10-03 14:30', entryId: 3421 } });
    const before = fs.readFileSync(path.join(dir, 'post.json'), 'utf-8');
    const { deleter, writer, cdn, confirm, log } = setup();

    const result = await deleter.delete({ dir }, { dryRun: true, purgeFiles: true });

    expect(result.status).toBe('dry-run');
    expect(confirm).not.toHaveBeenCalled();
    expect(writer.deleted).toEqual([]);
    expect(cdn.deleted).toEqual([]);
    expect(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8')).toBe(before);
    expect(log.join('\n')).toContain('Delete entry 3421: "My Trip", dated 2026-10-03 14:30');
});

test('declined confirmation deletes nothing', async () => {
    const { deleter, writer, cdn } = setup({ answer: false });

    const result = await deleter.delete({ entryId: 3421 }, { purgeFiles: true });

    expect(result.status).toBe('cancelled');
    expect(writer.deleted).toEqual([]);
    expect(cdn.deleted).toEqual([]);
});

test('--yes deletes without asking', async () => {
    const { deleter, writer, confirm } = setup({ answer: false });

    await deleter.delete({ entryId: 3421 }, { yes: true });

    expect(confirm).not.toHaveBeenCalled();
    expect(writer.deleted).toEqual([3421]);
});

test('--purge-files deletes the files no other entry uses, after the database delete', async () => {
    const order = [];
    const writer = fakeWriter({ shared: ['route.pdf'] });
    const cdn = fakeCdn();
    writer.deleteEntry = async () => order.push('database');
    cdn.delete = async (name) => order.push(`cdn:${name}`);
    const { deleter, log } = setup({ writer, cdn });

    const result = await deleter.delete({ entryId: 3421 }, { purgeFiles: true });

    expect(order).toEqual(['database', 'cdn:hero.jpg']);
    expect(result.purged).toEqual(['hero.jpg']);
    const text = log.join('\n');
    expect(text).toContain('delete from CDN: hero.jpg');
    expect(text).toContain('keep on CDN (another entry uses it): route.pdf');
});

test('a CDN failure after the database delete names the files left behind', async () => {
    const cdn = fakeCdn();
    cdn.delete = async (name) => {
        if (name === 'route.pdf') {
            throw new PublishError('Delete of route.pdf failed: HTTP 500.');
        }
        cdn.deleted.push(name);
    };
    const { deleter, writer } = setup({ cdn });

    await expect(deleter.delete({ entryId: 3421 }, { purgeFiles: true })).rejects.toMatchObject({
        message: expect.stringContaining('Deleted entry 3421'),
        details: ['route.pdf: Delete of route.pdf failed: HTTP 500.']
    });
    expect(writer.deleted).toEqual([3421]);
    expect(cdn.deleted).toEqual(['hero.jpg']);
});

test('if post.json cannot be reset after the delete, the error says so', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', entryId: 3421 } });
    const writer = fakeWriter();
    writer.deleteEntry = async () => {
        fs.rmSync(dir, { recursive: true, force: true });
    };
    const { deleter } = setup({ writer });

    await expect(deleter.delete({ dir })).rejects.toThrow(/Deleted entry 3421, but could not reset post.json/);
});
