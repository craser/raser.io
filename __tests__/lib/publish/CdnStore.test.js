/**
 * ABOUTME: Tests for the publisher's Bunny storage zone client.
 * ABOUTME: Injects a fake fetch; no network.
 *
 * @jest-environment node
 */

import CdnStore from '@/lib/publish/CdnStore';
import PublishError from '@/lib/publish/PublishError';

const fetchReturns = (status, body = null) => jest.fn().mockResolvedValue(new Response(body, { status }));

const store = (fetch) => new CdnStore({ host: 'la.storage.bunnycdn.com', zone: 'raserio', accessKey: 'test-key', fetch });

describe('list', () => {
    test('asks for the zone root with the access key', async () => {
        const fetch = fetchReturns(200, '[]');

        await store(fetch).list();

        expect(fetch).toHaveBeenCalledWith(
            'https://la.storage.bunnycdn.com/raserio/',
            expect.objectContaining({ headers: expect.objectContaining({ AccessKey: 'test-key' }) })
        );
    });

    test('maps file names to upper-case checksums and skips directories', async () => {
        const fetch = fetchReturns(200, JSON.stringify([
            { ObjectName: 'hero.jpg', IsDirectory: false, Checksum: 'ab12' },
            { ObjectName: 'maps', IsDirectory: true, Checksum: null },
            { ObjectName: 'old.gif', IsDirectory: false, Checksum: null }
        ]));

        const listing = await store(fetch).list();

        expect([...listing.entries()]).toEqual([['hero.jpg', 'AB12'], ['old.gif', null]]);
    });

    test('a failed listing is a PublishError naming the status', async () => {
        const promise = store(fetchReturns(401)).list();

        await expect(promise).rejects.toThrow(PublishError);
        await expect(store(fetchReturns(401)).list()).rejects.toThrow(/HTTP 401/);
    });
});

describe('upload', () => {
    test('PUTs the bytes to the encoded name', async () => {
        const fetch = fetchReturns(201);
        const bytes = Buffer.from('x');

        await store(fetch).upload('my photo.jpg', bytes, 'image/jpeg');

        expect(fetch).toHaveBeenCalledWith('https://la.storage.bunnycdn.com/raserio/my%20photo.jpg', {
            method: 'PUT',
            headers: { AccessKey: 'test-key', 'Content-Type': 'image/jpeg' },
            body: bytes
        });
    });

    test('a failed upload is a PublishError naming the file and status', async () => {
        await expect(store(fetchReturns(500)).upload('my photo.jpg', Buffer.from('x'), 'image/jpeg'))
            .rejects.toThrow(/my photo\.jpg.*HTTP 500/);
    });
});
