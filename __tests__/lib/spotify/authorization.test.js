/**
 * ABOUTME: Tests for the spotify-auth helpers: authorize URL, callback validation, code exchange.
 * ABOUTME: Pure functions plus an injected fake fetch; the entry script only wires them together.
 *
 * @jest-environment node
 */

import { buildAuthorizeUrl, readCallback, exchangeCode, REDIRECT_URI, SCOPE } from '@/lib/spotify/authorization';
import { TOKEN_URL } from '@/lib/spotify/SpotifyAccounts';

describe('constants', () => {
    test('the redirect URI is a loopback IP literal, since Spotify rejects localhost', () => {
        expect(REDIRECT_URI).toBe('http://127.0.0.1:8888/callback');
    });

    test('only asks to read recently played tracks', () => {
        expect(SCOPE).toBe('user-read-recently-played');
    });
});

describe('buildAuthorizeUrl', () => {
    test('asks Spotify for a code with the client id, scope, redirect URI and state', () => {
        const url = new URL(buildAuthorizeUrl({ clientId: 'id', state: 'xyz' }));

        expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize');
        expect(Object.fromEntries(url.searchParams)).toEqual({
            response_type: 'code',
            client_id: 'id',
            scope: 'user-read-recently-played',
            redirect_uri: 'http://127.0.0.1:8888/callback',
            state: 'xyz'
        });
    });
});

describe('readCallback', () => {
    test('returns the code when the state matches', () => {
        expect(readCallback('/callback?code=abc&state=xyz', 'xyz')).toBe('abc');
    });

    test('rejects a callback whose state does not match', () => {
        expect(() => readCallback('/callback?code=abc&state=other', 'xyz')).toThrow('state does not match');
    });

    test('reports a refusal from Spotify', () => {
        expect(() => readCallback('/callback?error=access_denied&state=xyz', 'xyz')).toThrow('access_denied');
    });

    test('rejects a callback with no code', () => {
        expect(() => readCallback('/callback?state=xyz', 'xyz')).toThrow('no authorization code');
    });
});

describe('exchangeCode', () => {
    test('trades the code for a refresh token using the same redirect URI', async () => {
        const fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: 'a', refresh_token: 'refresh' }), { status: 200 }));

        const refreshToken = await exchangeCode({ clientId: 'id', clientSecret: 'secret', code: 'abc', fetch });

        expect(refreshToken).toBe('refresh');
        expect(fetch).toHaveBeenCalledWith(TOKEN_URL, expect.objectContaining({
            body: new URLSearchParams({ grant_type: 'authorization_code', code: 'abc', redirect_uri: 'http://127.0.0.1:8888/callback' }).toString()
        }));
    });
});
