// ABOUTME: Wraps the Spotify Web API calls raser.io makes, returning plain Track objects instead of Spotify's JSON.
// ABOUTME: Authenticates with a long-lived refresh token, obtained once with `npm run spotify-auth`.

import { requestToken } from '@/lib/spotify/SpotifyAccounts';

export const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=50';

/**
 * @typedef {object} Track
 * @property {string} id Spotify track id
 * @property {string} title
 * @property {string[]} artists artist names
 * @property {string} url the track's page on open.spotify.com
 * @property {(string|null)} albumImageUrl the smallest album image, or null when the album has none
 */

export default class SpotifyClient {
    #clientId;
    #clientSecret;
    #refreshToken;
    #fetch;

    constructor({ clientId, clientSecret, refreshToken, fetch = globalThis.fetch }) {
        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
        this.#refreshToken = refreshToken;
        this.#fetch = fetch;
    }

    /**
     * Any refresh_token Spotify returns alongside the access token is ignored; the configured one keeps working.
     *
     * @returns {Promise<Track[]>} newest play first, repeats included; plays of local files are skipped
     */
    async getRecentlyPlayedTracks() {
        const { access_token: accessToken } = await requestToken({
            clientId: this.#clientId,
            clientSecret: this.#clientSecret,
            params: { grant_type: 'refresh_token', refresh_token: this.#refreshToken },
            fetch: this.#fetch
        });
        const response = await this.#fetch(RECENTLY_PLAYED_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error(`Spotify recently-played request failed: HTTP ${response.status}`);
        }
        const { items } = await response.json();
        return items
            .map((item) => item.track)
            .filter((track) => track?.id && track.external_urls?.spotify)
            .map(toTrack);
    }
}

function toTrack(track) {
    return {
        id: track.id,
        title: track.name,
        artists: track.artists.map((artist) => artist.name),
        url: track.external_urls.spotify,
        // Spotify lists album images widest first; a thumbnail only needs the smallest.
        albumImageUrl: track.album?.images?.at(-1)?.url ?? null
    };
}
