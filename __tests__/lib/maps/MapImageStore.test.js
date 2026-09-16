/**
 * ABOUTME: Tests for reading and writing generated map images on the CDN.
 * ABOUTME: Mocks only fetch, and exercises the real SiteConfig wiring behind the store.
 *
 * The environment pragma has to sit in this file's first docblock, so the ABOUTME
 * lines live here with it rather than in line comments above.
 *
 * @jest-environment node
 */

import MapImageStore from '@/lib/maps/MapImageStore';

const NAME = 'las-llajas.jpg';
const STORAGE_URL = 'https://la.storage.bunnycdn.com/raserio-maps/maps/las-llajas.jpg';
const IMAGE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

function storageReturns(status, body = null) {
    global.fetch = jest.fn().mockResolvedValue(new Response(body, { status }));
}

beforeEach(() => {
    process.env.BUNNY_STORAGE_HOST = 'la.storage.bunnycdn.com';
    process.env.BUNNY_STORAGE_ZONE = 'raserio-maps';
    process.env.BUNNY_STORAGE_ACCESS_KEY = 'test-access-key';
    storageReturns(200);
});

afterEach(() => {
    jest.restoreAllMocks();
});

function store() {
    return MapImageStore.getInstance();
}

test('is reached through a single shared instance', () => {
    expect(MapImageStore.getInstance()).toBe(MapImageStore.getInstance());
});

test('points at the cdn copy of the image', () => {
    expect(store().getPublicUrl(NAME)).toBe('https://raserio.b-cdn.net/maps/las-llajas.jpg');
});

describe('exists', () => {
    test('is true when the storage zone holds the image', async () => {
        expect(await store().exists(NAME)).toBe(true);
    });

    test('is false when the storage zone does not', async () => {
        storageReturns(404);

        expect(await store().exists(NAME)).toBe(false);
    });

    test('asks the storage zone, not the public cdn url', async () => {
        await store().exists(NAME);

        expect(global.fetch).toHaveBeenCalledWith(STORAGE_URL, expect.anything());
    });

    test('authenticates with the storage zone access key', async () => {
        await store().exists(NAME);

        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers.AccessKey).toBe('test-access-key');
    });

    test('reports a storage zone failure rather than guessing', async () => {
        storageReturns(500);

        await expect(store().exists(NAME)).rejects.toThrow(/500/);
    });
});

describe('save', () => {
    test('uploads the image to the storage zone', async () => {
        storageReturns(201);

        await store().save(NAME, IMAGE, 'image/jpeg');

        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toBe(STORAGE_URL);
        expect(options.method).toBe('PUT');
        expect(options.body).toBe(IMAGE);
    });

    test('sends the access key and content type', async () => {
        storageReturns(201);

        await store().save(NAME, IMAGE, 'image/jpeg');

        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers.AccessKey).toBe('test-access-key');
        expect(options.headers['Content-Type']).toBe('image/jpeg');
    });

    test('reports a rejected upload', async () => {
        storageReturns(401);

        await expect(store().save(NAME, IMAGE, 'image/jpeg')).rejects.toThrow(/401/);
    });
});
