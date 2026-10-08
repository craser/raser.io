/**
 * ABOUTME: Tests for /api/spotify/recent: 12 distinct tracks with hourly caching, or an uncached 502 on failure.
 * ABOUTME: Mocks only Next.js's NextResponse, SiteConfig and global fetch; the Spotify shim runs for real.
 *
 * @jest-environment node
 */

jest.mock('next/server', () => ({
    NextResponse: jest.fn()
}));

jest.mock('@/lib/SiteConfig', () => {
    const values = {
        'spotify.clientId': 'id',
        'spotify.clientSecret': 'secret',
        'spotify.refreshToken': 'rt'
    };
    return jest.fn().mockImplementation(() => ({
        getValue: jest.fn((name) => values[name])
    }));
});

const json = (status, body) => new Response(JSON.stringify(body), { status });

const play = (id) => ({
    track: { id, name: `title ${id}`, artists: [{ name: 'Artist' }], external_urls: { spotify: `https://open.spotify.com/track/${id}` }, album: { images: [] } }
});

describe('/api/spotify/recent', () => {
    let NextResponse;
    let consoleError;
    let consoleWarn;

    beforeEach(() => {
        jest.clearAllMocks();
        NextResponse = require('next/server').NextResponse;
        NextResponse.mockImplementation((body, init) => ({ body, status: init.status, headers: init.headers }));
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
        consoleWarn.mockRestore();
    });

    function spotifyReturns(ids) {
        global.fetch = jest.fn()
            .mockResolvedValueOnce(json(200, { access_token: 'access' }))
            .mockResolvedValueOnce(json(200, { items: ids.map(play) }));
    }

    test('is rendered per request, never prerendered at build time', () => {
        const { dynamic } = require('@/app/api/spotify/recent/route');
        expect(dynamic).toBe('force-dynamic');
    });

    test('returns the 12 most recent distinct tracks', async () => {
        const history = ['a', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];
        spotifyReturns(history);
        const { GET } = require('@/app/api/spotify/recent/route');

        const response = await GET();

        const { tracks } = JSON.parse(response.body);
        expect(tracks.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']);
        expect(response.status).toBe(200);
        expect(consoleError).not.toHaveBeenCalled();
        expect(consoleWarn).not.toHaveBeenCalled();
    });

    test('an empty listening history is a cached 200 with no tracks, and the reason is logged', async () => {
        spotifyReturns([]);
        const { GET } = require('@/app/api/spotify/recent/route');

        const response = await GET();

        expect(response.status).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ tracks: [] });
        expect(response.headers['Cache-Control']).toBe('public, s-maxage=3600, stale-while-revalidate=86400');
        expect(consoleWarn).toHaveBeenCalledWith('Spotify returned no recently played tracks.');
    });

    test('caches a success for an hour', async () => {
        spotifyReturns(['a']);
        const { GET } = require('@/app/api/spotify/recent/route');

        const response = await GET();

        expect(response.headers).toEqual({
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        });
    });

    test('a Spotify failure is an uncached 502, and the reason is logged', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(new Response('{"error":"invalid_client"}', { status: 400 }));
        const { GET } = require('@/app/api/spotify/recent/route');

        const response = await GET();

        expect(response.status).toBe(502);
        expect(response.headers).toEqual({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        expect(consoleError).toHaveBeenCalledWith(
            'Error fetching recently played tracks from Spotify:',
            expect.objectContaining({ message: expect.stringContaining('Spotify token request failed: HTTP 400') })
        );
    });
});
