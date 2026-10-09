/**
 * ABOUTME: Tests for the Spotify Web API shim: refresh-token exchange, recently-played call, mapping to Track.
 * ABOUTME: Injects a fake fetch; no network.
 *
 * @jest-environment node
 */

import SpotifyClient, { RECENTLY_PLAYED_URL } from '@/lib/spotify/SpotifyClient';
import { TOKEN_URL } from '@/lib/spotify/SpotifyAccounts';

const json = (status, body) => new Response(JSON.stringify(body), { status });

const play = ({ id = 'track1', name = 'Song', artists = ['Artist'], url = `https://open.spotify.com/track/${id}`, images = [{ url: 'big.jpg', width: 640 }, { url: 'small.jpg', width: 64 }] } = {}) => ({
    played_at: '2026-10-07T12:00:00.000Z',
    track: {
        id,
        name,
        artists: artists.map((artistName) => ({ name: artistName })),
        external_urls: url ? { spotify: url } : {},
        album: { images }
    }
});

function fakeSpotify(items, { tokenStatus = 200, playsStatus = 200 } = {}) {
    return jest.fn()
        .mockResolvedValueOnce(tokenStatus === 200 ? json(200, { access_token: 'access' }) : new Response('{"error":"invalid_grant"}', { status: tokenStatus }))
        .mockResolvedValueOnce(json(playsStatus, { items }));
}

const client = (fetch) => new SpotifyClient({ clientId: 'id', clientSecret: 'secret', refreshToken: 'rt', fetch });

describe('getRecentlyPlayedTracks', () => {
    test('exchanges the refresh token for an access token', async () => {
        const fetch = fakeSpotify([]);

        await client(fetch).getRecentlyPlayedTracks();

        expect(fetch).toHaveBeenNthCalledWith(1, TOKEN_URL, expect.objectContaining({
            method: 'POST',
            body: 'grant_type=refresh_token&refresh_token=rt'
        }));
    });

    test('asks for the last 50 plays with the access token', async () => {
        const fetch = fakeSpotify([]);

        await client(fetch).getRecentlyPlayedTracks();

        expect(RECENTLY_PLAYED_URL).toBe('https://api.spotify.com/v1/me/player/recently-played?limit=50');
        expect(fetch).toHaveBeenNthCalledWith(2, RECENTLY_PLAYED_URL, {
            headers: { Authorization: 'Bearer access' },
            cache: 'no-store'
        });
    });

    test('maps plays to Tracks, newest first, keeping repeats', async () => {
        const fetch = fakeSpotify([
            play({ id: 'a', name: 'First', artists: ['One', 'Two'] }),
            play({ id: 'b', name: 'Second' }),
            play({ id: 'a', name: 'First', artists: ['One', 'Two'] })
        ]);

        const tracks = await client(fetch).getRecentlyPlayedTracks();

        expect(tracks).toEqual([
            { id: 'a', title: 'First', artists: ['One', 'Two'], url: 'https://open.spotify.com/track/a', albumImageUrl: 'small.jpg' },
            { id: 'b', title: 'Second', artists: ['Artist'], url: 'https://open.spotify.com/track/b', albumImageUrl: 'small.jpg' },
            { id: 'a', title: 'First', artists: ['One', 'Two'], url: 'https://open.spotify.com/track/a', albumImageUrl: 'small.jpg' }
        ]);
    });

    test('a track with no album art has a null albumImageUrl', async () => {
        const fetch = fakeSpotify([play({ images: [] })]);

        const [track] = await client(fetch).getRecentlyPlayedTracks();

        expect(track.albumImageUrl).toBeNull();
    });

    test('skips plays of local files, which have no Spotify id or link', async () => {
        const fetch = fakeSpotify([play({ id: null, url: null }), play({ id: 'b' })]);

        const tracks = await client(fetch).getRecentlyPlayedTracks();

        expect(tracks.map((t) => t.id)).toEqual(['b']);
    });

    test('a refused token exchange rejects without calling the Web API', async () => {
        const fetch = fakeSpotify([], { tokenStatus: 400 });

        await expect(client(fetch).getRecentlyPlayedTracks()).rejects.toThrow('Spotify token request failed: HTTP 400');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('a failed recently-played request rejects with its status', async () => {
        const fetch = fakeSpotify([], { playsStatus: 403 });

        await expect(client(fetch).getRecentlyPlayedTracks()).rejects.toThrow('Spotify recently-played request failed: HTTP 403');
    });
});
