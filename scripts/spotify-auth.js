// ABOUTME: Command line entry point for `npm run spotify-auth`: authorizes raser.io once and prints the refresh token.
// ABOUTME: Bundled into bin/spotify-auth.mjs; runs under `op run` so the client credentials come from 1Password.

import crypto from 'node:crypto';
import http from 'node:http';
import { AUTH_PORT, buildAuthorizeUrl, exchangeCode, readCallback } from '@/lib/spotify/authorization';
import SpotifyClient from '@/lib/spotify/SpotifyClient';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (!clientId || !clientSecret) {
    console.error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set; check scripts/spotify/spotify.env.');
    process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');

const server = http.createServer(async (request, response) => {
    if (!request.url.startsWith('/callback')) {
        response.writeHead(404).end();
        return;
    }
    try {
        const code = readCallback(request.url, state);
        const refreshToken = await exchangeCode({ clientId, clientSecret, code });
        // Proves the token works through the same code path the site uses.
        const tracks = await new SpotifyClient({ clientId, clientSecret, refreshToken }).getRecentlyPlayedTracks();
        response.writeHead(200, { 'Content-Type': 'text/plain' }).end('raser.io is authorized. You can close this tab.');
        console.log(`Spotify returned ${tracks.length} recently played tracks.`);
        console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
    } catch (error) {
        response.writeHead(400, { 'Content-Type': 'text/plain' }).end(error.message);
        console.error(error.message);
        process.exitCode = 1;
    }
    server.close();
});

server.listen(AUTH_PORT, '127.0.0.1', () => {
    console.log(`Open this URL to authorize raser.io:\n${buildAuthorizeUrl({ clientId, state })}`);
});
