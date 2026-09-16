/**
 * ABOUTME: Integration tests for GET /api/maps/mapimageuri/[fileName].
 * ABOUTME: Mocks only the CDN fetch, and asserts on the real Response the route returns.
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

function request() {
    return new Request(`http://localhost/api/maps/mapimageuri/${FILE_NAME}`);
}

function get(fileName = FILE_NAME) {
    return GET(request(), { params: { fileName } });
}

function cdnReturns(body, init = { status: 200 }) {
    global.fetch = jest.fn().mockResolvedValue(new Response(body, init));
}

beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-google-api-key';
    jest.spyOn(console, 'error').mockImplementation(() => {});
    cdnReturns(FIXTURE);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('a track that exists', () => {
    test('responds with the map image url as plain text', async () => {
        const response = await get();
        const url = await response.text();

        expect(response.status).toBe(200);
        expect(url.startsWith('//maps.googleapis.com/maps/api/staticmap?')).toBe(true);
    });

    test('sizes the image as a postcard and draws the track', async () => {
        const url = await (await get()).text();

        expect(url).toContain('size=630x290');
        expect(url).toContain('path=color:0xFF0000BF|weight:3|34.2794,-118.6828');
    });

    test('signs the request with the configured api key', async () => {
        const url = await (await get()).text();

        expect(url).toContain('key=test-google-api-key');
    });

    test('says the body is plain text', async () => {
        const response = await get();

        expect(response.headers.get('Content-Type')).toMatch(/^text\/plain/);
    });

    test('lets the url be cached for an hour', async () => {
        const response = await get();

        expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
    });

    test('reads the gpx from the cdn', async () => {
        await get();

        expect(global.fetch).toHaveBeenCalledWith(
            `https://raserio.b-cdn.net/${FILE_NAME}`,
            expect.anything()
        );
    });
});

describe('a track that does not work out', () => {
    test('leaves the happy path unlogged', async () => {
        await get();

        expect(console.error).not.toHaveBeenCalled();
    });

    test('responds 404 when the cdn has no such file', async () => {
        cdnReturns('Not Found', { status: 404 });

        expect((await get('missing.gpx')).status).toBe(404);
    });

    test('responds 502 when the document holds no track', async () => {
        cdnReturns('<gpx><wpt lat="1" lon="2"></wpt></gpx>');

        expect((await get()).status).toBe(502);
        expect(console.error).toHaveBeenCalled();
    });

    test('responds 502 when the document is not gpx at all', async () => {
        cdnReturns('<html><body>nope</body></html>');

        expect((await get()).status).toBe(502);
        expect(console.error).toHaveBeenCalled();
    });

    test('responds 502 when the cdn is unreachable', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

        expect((await get()).status).toBe(502);
        expect(console.error).toHaveBeenCalled();
    });
});
