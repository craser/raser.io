// ABOUTME: Requests tokens from the Spotify Accounts service with the app's client credentials.
// ABOUTME: Shared by SpotifyClient (refresh-token grant) and the spotify-auth script (authorization-code grant).

export const TOKEN_URL = 'https://accounts.spotify.com/api/token';

/**
 * @param {object} options
 * @param {string} options.clientId
 * @param {string} options.clientSecret
 * @param {object} options.params form parameters, e.g. { grant_type: 'refresh_token', refresh_token }
 * @param {function} [options.fetch]
 * @returns {Promise<object>} Spotify's token response (access_token, and sometimes refresh_token)
 */
export async function requestToken({ clientId, clientSecret, params, fetch = globalThis.fetch }) {
    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params).toString(),
        cache: 'no-store'
    });
    if (!response.ok) {
        throw new Error(`Spotify token request failed: HTTP ${response.status} ${await response.text()}`);
    }
    return response.json();
}
