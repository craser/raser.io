/**
 * ABOUTME: Tests for reading a post folder from disk and writing publish results back to post.json.
 * ABOUTME: Uses real temporary folders built by the postFixture helper.
 *
 * @jest-environment node
 */

import fs from 'node:fs';
import path from 'node:path';
import { readPostFolder, writeBack, sha256 } from '@/lib/publish/PostFolder';
import PublishError from '@/lib/publish/PublishError';
import { makePostFolder, removeFolder } from './support/postFixture';

let dir;

afterEach(() => {
    if (dir) {
        removeFolder(dir);
        dir = null;
    }
});

/** FileInfo without the machine-specific absolutePath, for comparisons. */
const portable = ({ absolutePath, ...rest }) => rest;

describe('readPostFolder', () => {
    test('reads post.json, intro.html and body.html', () => {
        dir = makePostFolder({ post: { title: 'My Trip' }, intro: '<p>i</p>', body: '<p>b</p>' });

        const folder = readPostFolder(dir);

        expect(folder.dir).toBe(dir);
        expect(folder.post).toEqual({ title: 'My Trip' });
        expect(folder.intro).toBe('<p>i</p>');
        expect(folder.body).toBe('<p>b</p>');
        expect(folder.files).toEqual([]);
    });

    test('drops top-level keys that start with "_"', () => {
        dir = makePostFolder({ post: { title: 'T', _attachmentExample: { path: 'x' }, _note: 'hi' } });

        expect(readPostFolder(dir).post).toEqual({ title: 'T' });
    });

    test('a missing intro.html reads as null and a missing body.html as empty', () => {
        dir = makePostFolder({ intro: null, body: null });

        const folder = readPostFolder(dir);

        expect(folder.intro).toBeNull();
        expect(folder.body).toBe('');
    });

    test('a missing post.json is a PublishError', () => {
        dir = makePostFolder({ post: null });

        expect(() => readPostFolder(dir)).toThrow(PublishError);
    });

    test('post.json that is not JSON is a PublishError', () => {
        dir = makePostFolder({ post: '{ nope' });

        expect(() => readPostFolder(dir)).toThrow(/not valid JSON/);
    });

    test('post.json that is not an object is a PublishError', () => {
        dir = makePostFolder({ post: '[1, 2]' });

        expect(() => readPostFolder(dir)).toThrow(PublishError);
    });

    test('lists files under images/ and docs/ with kind, MIME type and checksum, sorted by path', () => {
        dir = makePostFolder({
            files: {
                'images/hero.jpg': 'jpg-bytes',
                'docs/route.pdf': 'pdf-bytes',
                'images/ride.gpx': '<gpx/>'
            }
        });

        const folder = readPostFolder(dir);

        expect(folder.files.map(portable)).toEqual([
            { path: 'docs/route.pdf', name: 'route.pdf', kind: 'document', mimeType: 'application/pdf', checksum: sha256(Buffer.from('pdf-bytes')) },
            { path: 'images/hero.jpg', name: 'hero.jpg', kind: 'image', mimeType: 'image/jpeg', checksum: sha256(Buffer.from('jpg-bytes')) },
            { path: 'images/ride.gpx', name: 'ride.gpx', kind: 'map', mimeType: 'application/gpx+xml', checksum: sha256(Buffer.from('<gpx/>')) }
        ]);
        expect(folder.files[1].absolutePath).toBe(path.join(dir, 'images', 'hero.jpg'));
    });

    test('walks subfolders', () => {
        dir = makePostFolder({ files: { 'images/day1/a.jpg': 'a' } });

        expect(readPostFolder(dir).files.map(portable)).toEqual([
            { path: 'images/day1/a.jpg', name: 'a.jpg', kind: 'image', mimeType: 'image/jpeg', checksum: sha256(Buffer.from('a')) }
        ]);
    });

    test('ignores dotfiles such as .DS_Store, and dot-folders', () => {
        dir = makePostFolder({
            files: {
                'images/.DS_Store': 'junk',
                'images/a.jpg': 'a',
                'docs/.hidden/b.pdf': 'b'
            }
        });

        expect(readPostFolder(dir).files.map(f => f.path)).toEqual(['images/a.jpg']);
    });

    test('extension matching ignores case', () => {
        dir = makePostFolder({ files: { 'images/IMG_1.JPG': 'a', 'docs/Ride.GPX': 'b' } });

        const byName = Object.fromEntries(readPostFolder(dir).files.map(f => [f.name, f]));

        expect(byName['IMG_1.JPG']).toMatchObject({ kind: 'image', mimeType: 'image/jpeg' });
        expect(byName['Ride.GPX']).toMatchObject({ kind: 'map', mimeType: 'application/gpx+xml' });
    });

    test('unknown extensions get application/octet-stream', () => {
        dir = makePostFolder({ files: { 'docs/notes.xyz': 'n' } });

        expect(readPostFolder(dir).files[0].mimeType).toBe('application/octet-stream');
    });

    test('ignores files outside images/ and docs/', () => {
        dir = makePostFolder({ files: { 'other/x.jpg': 'x', 'stray.jpg': 's' } });

        expect(readPostFolder(dir).files).toEqual([]);
    });
});

describe('sha256', () => {
    test('is upper-case hex', () => {
        expect(sha256(Buffer.from('abc'))).toBe('BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
    });
});

describe('writeBack', () => {
    test('writes entryId and datePosted, keeping other content and key order', () => {
        dir = makePostFolder({ post: { title: 'T', datePosted: null, _attachmentExample: { path: 'p' }, entryId: null } });

        writeBack(dir, { entryId: 3421, datePosted: '2026-10-03 14:30' });

        expect(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8')).toBe(
            `${JSON.stringify({ title: 'T', datePosted: '2026-10-03 14:30', _attachmentExample: { path: 'p' }, entryId: 3421 }, null, 2)}\n`
        );
    });
});
