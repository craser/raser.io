/**
 * ABOUTME: Tests for the publish sequence: validate, plan, confirm, upload, write, write back.
 * ABOUTME: Real temporary post folders, with in-memory fakes for the CDN and the database writer.
 *
 * @jest-environment node
 */

import fs from 'node:fs';
import path from 'node:path';
import Publisher from '@/lib/publish/Publisher';
import PublishError from '@/lib/publish/PublishError';
import { sha256 } from '@/lib/publish/PostFolder';
import { makePostFolder, removeFolder } from './support/postFixture';

const NOW = new Date(2026, 9, 3, 14, 30, 7);

function fakeCdn(listing = {}) {
    return {
        listing: new Map(Object.entries(listing)),
        uploads: [],
        async list() {
            return this.listing;
        },
        async upload(name, bytes, contentType) {
            this.uploads.push({ name, bytes: Buffer.from(bytes).toString(), contentType });
        }
    };
}

function fakeWriter(entries = {}) {
    return {
        records: [],
        nextEntryId: jest.fn(async () => 3421),
        async findEntry(entryId) {
            return entryId in entries ? { entryId, attachmentNames: new Set(entries[entryId]) } : null;
        },
        async write(record) {
            this.records.push(record);
            return record.entryId ?? 3421;
        }
    };
}

function setup({ cdn = fakeCdn(), writer = fakeWriter(), answer = true } = {}) {
    const log = [];
    const confirm = jest.fn(async () => answer);
    const publisher = new Publisher({ cdn, writer, confirm, log: line => log.push(line), now: () => NOW });
    return { publisher, cdn, writer, confirm, log };
}

const readPost = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8'));

let dir;

afterEach(() => {
    if (dir) {
        removeFolder(dir);
        dir = null;
    }
});

test('publishes a new post: uploads, writes, and records the entry in post.json', async () => {
    dir = makePostFolder({
        post: { title: 'My Trip', datePosted: null, entryId: null },
        intro: '<img src="images/hero.jpg">',
        files: { 'images/hero.jpg': 'jpg' }
    });
    const { publisher, cdn, writer } = setup();

    const result = await publisher.publish(dir);

    expect(result).toMatchObject({ status: 'published', entryId: 3421 });
    expect(cdn.uploads).toEqual([{ name: 'hero.jpg', bytes: 'jpg', contentType: 'image/jpeg' }]);
    expect(writer.records[0]).toMatchObject({
        entryId: null,
        intro: '<img src="https://raserio.b-cdn.net/hero.jpg">',
        datePosted: '2026-10-03 14:30:00',
        lastUpdated: '2026-10-03 14:30:07'
    });
    expect(readPost(dir)).toMatchObject({ entryId: 3421, datePosted: '2026-10-03 14:30' });
});

test('keeps a datePosted that post.json already has', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', datePosted: '2020-01-02 03:04' } });
    const { publisher, writer } = setup();

    await publisher.publish(dir);

    expect(writer.records[0].datePosted).toBe('2020-01-02 03:04:00');
    expect(readPost(dir).datePosted).toBe('2020-01-02 03:04');
});

test('re-publishing an unchanged post skips its files and updates the same entry', async () => {
    dir = makePostFolder({
        post: { title: 'My Trip', datePosted: '2026-10-03 14:30', entryId: 3421 },
        files: { 'images/hero.jpg': 'jpg' }
    });
    const { publisher, cdn, writer } = setup({
        cdn: fakeCdn({ 'hero.jpg': sha256(Buffer.from('jpg')) }),
        writer: fakeWriter({ 3421: ['hero.jpg'] })
    });

    const result = await publisher.publish(dir);

    expect(cdn.uploads).toEqual([]);
    expect(writer.records[0].entryId).toBe(3421);
    expect(result.entryId).toBe(3421);
});

test('validation problems stop everything and are all reported', async () => {
    dir = makePostFolder({ post: { title: '' } });
    const { publisher, cdn, writer } = setup();

    await expect(publisher.publish(dir)).rejects.toMatchObject({
        name: 'PublishError',
        details: [expect.stringContaining('"title"')]
    });
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
});

test('an entryId with no matching entry is refused rather than duplicated', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', entryId: 9999 } });
    const { publisher, writer } = setup();

    await expect(publisher.publish(dir)).rejects.toThrow(/no such entry/);
    expect(writer.records).toEqual([]);
});

test('collisions stop the run before any file is uploaded', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'new', 'images/other.jpg': 'o' } });
    const { publisher, cdn, writer } = setup({ cdn: fakeCdn({ 'hero.jpg': 'DIFFERENT' }) });

    await expect(publisher.publish(dir)).rejects.toMatchObject({
        message: expect.stringContaining('--force'),
        details: [expect.stringContaining('hero.jpg')]
    });
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
});

test('--force overwrites colliding files', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'new', 'images/other.jpg': 'o' } });
    const { publisher, cdn, log } = setup({ cdn: fakeCdn({ 'hero.jpg': 'DIFFERENT' }) });

    const result = await publisher.publish(dir, { force: true });

    expect(result.status).toBe('published');
    expect(cdn.uploads.map(u => u.name)).toEqual(['hero.jpg', 'other.jpg']);
    expect(log.join('\n')).toContain('upload: hero.jpg (overwrites existing file, --force)');
});

test('a dry run changes nothing and does not ask', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'jpg' } });
    const before = fs.readFileSync(path.join(dir, 'post.json'), 'utf-8');
    const { publisher, cdn, writer, confirm, log } = setup();

    const result = await publisher.publish(dir, { dryRun: true });

    expect(result.status).toBe('dry-run');
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
    expect(confirm).not.toHaveBeenCalled();
    expect(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8')).toBe(before);
    expect(log.join('\n')).toContain('New entry (will be 3421): "My Trip"');
    expect(writer.nextEntryId).toHaveBeenCalledTimes(1);
});

test('an update dry run does not ask for the next entry ID', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', entryId: 3421 } });
    const { publisher, writer } = setup({ writer: fakeWriter({ 3421: [] }) });

    await publisher.publish(dir, { dryRun: true });

    expect(writer.nextEntryId).not.toHaveBeenCalled();
});

test('declined confirmation cancels with nothing uploaded, written or changed', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'jpg' } });
    const before = fs.readFileSync(path.join(dir, 'post.json'), 'utf-8');
    const { publisher, cdn, writer, confirm } = setup({ answer: false });

    const result = await publisher.publish(dir);

    expect(confirm).toHaveBeenCalledWith('Publish "My Trip" (new entry) with 1 files to raser.io?');
    expect(result.status).toBe('cancelled');
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
    expect(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8')).toBe(before);
});

test('--yes publishes without asking', async () => {
    dir = makePostFolder();
    const { publisher, confirm } = setup({ answer: false });

    const result = await publisher.publish(dir, { yes: true });

    expect(confirm).not.toHaveBeenCalled();
    expect(result.status).toBe('published');
});

test('a failed upload stops before the database is touched', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'jpg' } });
    const cdn = fakeCdn();
    cdn.upload = async () => {
        throw new PublishError('Upload of hero.jpg failed: HTTP 500.');
    };
    const { publisher, writer } = setup({ cdn });

    await expect(publisher.publish(dir)).rejects.toThrow(/HTTP 500/);
    expect(writer.records).toEqual([]);
});

test('if post.json cannot be updated after the write, the error gives the new entryId', async () => {
    dir = makePostFolder();
    const writer = fakeWriter();
    writer.write = async () => {
        fs.rmSync(dir, { recursive: true, force: true });
        return 3421;
    };
    const { publisher } = setup({ writer });

    await expect(publisher.publish(dir)).rejects.toThrow(/"entryId": 3421/);
});

test('the plan lists uploads, unchanged files and tags', async () => {
    dir = makePostFolder({
        post: { title: 'My Trip', entryId: 3421, tags: ['bikes', 'mtb'] },
        files: { 'images/new.jpg': 'n', 'images/same.jpg': 's' }
    });
    const { publisher, log } = setup({
        cdn: fakeCdn({ 'same.jpg': sha256(Buffer.from('s')) }),
        writer: fakeWriter({ 3421: ['same.jpg'] })
    });

    await publisher.publish(dir, { dryRun: true });

    const text = log.join('\n');
    expect(text).toContain('Update entry 3421: "My Trip"');
    expect(text).toContain('upload: new.jpg');
    expect(text).toContain('unchanged: same.jpg');
    expect(text).toContain('tags: bikes, mtb');
});
