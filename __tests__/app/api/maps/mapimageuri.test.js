/**
 * ABOUTME: Integration tests for GET /api/maps/mapimageuri/[fileName].
 * ABOUTME: Routes mocked fetches by host, so the CDN, storage zone and Google are distinct.
 *
 * The environment pragma has to sit in this file's first docblock, so the ABOUTME
 * lines live here with it rather than in line comments above.
 *
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { GET } from '@/app/api/maps/mapimageuri/[fileName]/route';

const FIXTURE = fs.readFileSync(
    path.join(__dirname, '../../../lib/maps/fixtures/track.gpx'), 'utf8'
);

const FILE_NAME = '20071014-las-llajas-rocky-peak.gpx';
const CDN_URL = 'https://raserio.b-cdn.net/maps/20071014-las-llajas-rocky-peak.jpg';
const IMAGE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

/** Replies keyed by which host the route is talking to. */
let reply;

function imageResponse() {
    return new Response(IMAGE, { status: 200, headers: { 'Content-Type': 'image/jpeg' } });
}

function routedFetch(url, options = {}) {
    if (url.includes('storage.bunnycdn.com')) {
        return Promise.resolve(reply.storage(options));
    }
    if (url.includes('.gpx')) {
        return Promise.resolve(reply.gpx());
    }
    if (url.includes('maps.googleapis.com')) {
        return Promise.resolve(reply.google());
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
}

function calls(fragment) {
    return global.fetch.mock.calls.filter(([url]) => url.includes(fragment));
}

function get(fileName = FILE_NAME) {
    const request = new Request(`http://localhost/api/maps/mapimageuri/${fileName}`);
    return GET(request, { params: { fileName } });
}

beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-google-api-key';
    process.env.BUNNY_STORAGE_HOST = 'la.storage.bunnycdn.com';
    process.env.BUNNY_STORAGE_ZONE = 'raserio-maps';
    process.env.BUNNY_STORAGE_ACCESS_KEY = 'test-access-key';
    jest.spyOn(console, 'error').mockImplementation(() => {});

    reply = {
        storage: (options) => new Response(null, { status: options.method === 'PUT' ? 201 : 404 }),
        gpx: () => new Response(FIXTURE, { status: 200 }),
        google: () => imageResponse()
    };
    global.fetch = jest.fn(routedFetch);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('an image the cdn already holds', () => {
    beforeEach(() => {
        reply.storage = () => new Response(null, { status: 200 });
    });

    test('returns the cdn url', async () => {
        const response = await get();

        expect(response.status).toBe(200);
        expect(await response.text()).toBe(CDN_URL);
    });

    test('does not read the gpx track', async () => {
        await get();

        expect(calls('.gpx')).toHaveLength(0);
    });

    test('does not ask google for a new image', async () => {
        await get();

        expect(calls('maps.googleapis.com')).toHaveLength(0);
    });

    test('logs nothing', async () => {
        await get();

        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('an image the cdn does not hold yet', () => {
    test('returns the cdn url', async () => {
        expect(await (await get()).text()).toBe(CDN_URL);
    });

    test('asks google for the image over https', async () => {
        await get();

        const [url] = calls('maps.googleapis.com')[0];
        expect(url.startsWith('https://maps.googleapis.com/')).toBe(true);
    });

    test('uploads what google returned', async () => {
        await get();

        const [, options] = calls('storage.bunnycdn.com').find(([, o]) => o.method === 'PUT');
        expect(Buffer.from(options.body)).toEqual(Buffer.from(IMAGE));
        expect(options.headers['Content-Type']).toBe('image/jpeg');
    });

    test('logs nothing', async () => {
        await get();

        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('when the cdn cannot be used', () => {
    test('falls back to the google url when the upload is rejected', async () => {
        reply.storage = (options) => new Response(null, { status: options.method === 'PUT' ? 401 : 404 });

        const url = await (await get()).text();

        expect(url.startsWith('//maps.googleapis.com/')).toBe(true);
        expect(console.error).toHaveBeenCalled();
    });

    test('falls back to the google url when the storage zone errors', async () => {
        reply.storage = () => new Response(null, { status: 500 });

        const url = await (await get()).text();

        expect(url.startsWith('//maps.googleapis.com/')).toBe(true);
        expect(console.error).toHaveBeenCalled();
    });

    test('falls back to the google url when the storage zone is unconfigured', async () => {
        delete process.env.BUNNY_STORAGE_HOST;
        delete process.env.BUNNY_STORAGE_ZONE;
        delete process.env.BUNNY_STORAGE_ACCESS_KEY;

        const url = await (await get()).text();

        expect(url.startsWith('//maps.googleapis.com/')).toBe(true);
    });
});

describe('failures with nothing to show', () => {
    test('responds 404 when the cdn has no such track', async () => {
        reply.gpx = () => new Response('Not Found', { status: 404 });

        expect((await get('missing.gpx')).status).toBe(404);
    });

    test('responds 502 when the document holds no track', async () => {
        reply.gpx = () => new Response('<gpx><wpt lat="1" lon="2"></wpt></gpx>', { status: 200 });

        expect((await get()).status).toBe(502);
        expect(console.error).toHaveBeenCalled();
    });

    test('responds 502 when google will not render the image', async () => {
        reply.google = () => new Response('quota exceeded', { status: 403 });

        expect((await get()).status).toBe(502);
        expect(console.error).toHaveBeenCalled();
    });

    test('responds 400 for a name that would escape the image directory', async () => {
        expect((await get('../../secrets.gpx')).status).toBe(400);
        expect(calls('storage.bunnycdn.com')).toHaveLength(0);
    });
});

describe('the response itself', () => {
    test('is plain text', async () => {
        expect((await get()).headers.get('Content-Type')).toMatch(/^text\/plain/);
    });

    test('may be cached for an hour', async () => {
        expect((await get()).headers.get('Cache-Control')).toContain('max-age=3600');
    });
});
