/**
 * ABOUTME: Tests for turning a validated post folder into the record written to the database.
 * ABOUTME: Also covers the local-time timestamp formatting the record uses.
 *
 * @jest-environment node
 */

import { buildPostRecord } from '@/lib/publish/postRecord';
import { formatLocalMinute, formatLocalSecond } from '@/lib/publish/timestamps';

const FILES = [
    { path: 'images/hero.jpg', name: 'hero.jpg', kind: 'image', mimeType: 'image/jpeg' },
    { path: 'images/ride.gpx', name: 'ride.gpx', kind: 'map', mimeType: 'application/gpx+xml' },
    { path: 'docs/route.pdf', name: 'route.pdf', kind: 'document', mimeType: 'application/pdf' }
];
const TIMES = { entryId: null, datePosted: '2026-10-03 14:30', lastUpdated: '2026-10-03 14:31:07' };

function folder(post = {}, { intro = '<p>i</p>', body = '' } = {}) {
    return { post: { title: 'My Trip', ...post }, intro, body, files: FILES };
}

describe('timestamps', () => {
    test('formats local time to the minute and to the second', () => {
        const date = new Date(2026, 9, 3, 4, 5, 6);

        expect(formatLocalMinute(date)).toBe('2026-10-03 04:05');
        expect(formatLocalSecond(date)).toBe('2026-10-03 04:05:06');
    });
});

describe('buildPostRecord', () => {
    test('maps the post fields and fixed values', () => {
        const record = buildPostRecord(folder({ via: { url: 'https://v.example', title: 'V', text: 'via' } }), TIMES);

        expect(record).toMatchObject({
            entryId: null,
            title: 'My Trip',
            intro: '<p>i</p>',
            body: null,
            datePosted: '2026-10-03 14:30:00',
            lastUpdated: '2026-10-03 14:31:07',
            imageFileName: null,
            imageFileType: null,
            viaUrl: 'https://v.example',
            viaTitle: 'V',
            viaText: 'via',
            userId: 1,
            userName: 'Chris',
            tags: []
        });
    });

    test('carries an existing entryId through', () => {
        expect(buildPostRecord(folder(), { ...TIMES, entryId: 3421 }).entryId).toBe(3421);
    });

    test('trims the title', () => {
        expect(buildPostRecord(folder({ title: '  My Trip  ' }), TIMES).title).toBe('My Trip');
    });

    test('an image title image is type 1, a .gpx title image is type 0', () => {
        expect(buildPostRecord(folder({ titleImage: 'images/hero.jpg' }), TIMES)).toMatchObject({ imageFileName: 'hero.jpg', imageFileType: 1 });
        expect(buildPostRecord(folder({ titleImage: 'images/ride.gpx' }), TIMES)).toMatchObject({ imageFileName: 'ride.gpx', imageFileType: 0 });
    });

    test('rewrites folder links in intro and body to CDN URLs', () => {
        const record = buildPostRecord(folder({}, { intro: '<img src="images/hero.jpg">', body: '<a href="docs/route.pdf">r</a>' }), TIMES);

        expect(record.intro).toBe('<img src="https://raserio.b-cdn.net/hero.jpg">');
        expect(record.body).toBe('<a href="https://raserio.b-cdn.net/route.pdf">r</a>');
    });

    test('a whitespace-only body is stored as null', () => {
        expect(buildPostRecord(folder({}, { body: '  \n' }), TIMES).body).toBeNull();
    });

    test('missing via fields become null', () => {
        expect(buildPostRecord(folder(), TIMES)).toMatchObject({ viaUrl: null, viaTitle: null, viaText: null });
    });

    test('tags are trimmed and de-duplicated', () => {
        expect(buildPostRecord(folder({ tags: [' bikes ', 'bikes', 'mtb'] }), TIMES).tags).toEqual(['bikes', 'mtb']);
    });

    test('every file becomes an attachment, with metadata where post.json gives it', () => {
        const record = buildPostRecord(folder({
            attachments: [{ path: 'images/hero.jpg', title: 'Halls Lake', description: 'Camp', gallery: true }]
        }), TIMES);

        expect(record.attachments).toEqual([
            { fileName: 'hero.jpg', fileType: 'image', mimeType: 'image/jpeg', title: 'Halls Lake', description: 'Camp', isGallery: true },
            { fileName: 'ride.gpx', fileType: 'map', mimeType: 'application/gpx+xml', title: 'ride.gpx', description: null, isGallery: false },
            { fileName: 'route.pdf', fileType: 'document', mimeType: 'application/pdf', title: 'route.pdf', description: null, isGallery: false }
        ]);
    });
});
