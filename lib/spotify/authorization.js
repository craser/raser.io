// ABOUTME: Helpers for the one-time Spotify authorization done by `npm run spotify-auth`.
// ABOUTME: Builds the authorize URL, validates the callback, and trades the code for a refresh token.

import { requestToken } from '@/lib/spotify/SpotifyAccounts';

export const AUTH_PORT = 8888;
// Spotify rejects "localhost" redirect URIs; loopback must be an IP literal.
export const REDIRECT_URI = `http://127.0.0.1:${AUTH_PORT}/callback`;
export const SCOPE = 'user-read-recently-played';

export function buildAuthorizeUrl({ clientId, state }) {
    const url = new URL('https://accounts.spotify.com/authorize');
    url.search = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: SCOPE,
        redirect_uri: REDIRECT_URI,
        state
    }).toString();
    return url.toString();
}

/**
 * @param {string} requestUrl the path and query Spotify redirected the browser to
 * @param {string} expectedState the state sent in the authorize URL
 * @returns {string} the authorization code
 */
export function readCallback(requestUrl, expectedState) {
    const params = new URL(requestUrl, REDIRECT_URI).searchParams;
    if (params.get('state') !== expectedState) {
        throw new Error('Spotify callback state does not match the authorize request.');
    }
    if (params.get('error')) {
        throw new Error(`Spotify authorization was refused: ${params.get('error')}`);
    }
    const code = params.get('code');
    if (!code) {
        throw new Error('Spotify callback has no authorization code.');
    }
    return code;
}

/**
 * @returns {Promise<string>} the refresh token
 */
export async function exchangeCode({ clientId, clientSecret, code, fetch }) {
    const { refresh_token: refreshToken } = await requestToken({
        clientId,
        clientSecret,
        params: { grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI },
        fetch
    });
    return refreshToken;
}
