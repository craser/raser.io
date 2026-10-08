# Spotify "Listening" Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flag-gated "Listening" section to the landing front page listing the last 12 distinct tracks Chris played on Spotify.

**Architecture:** A shim in `lib/spotify/` swaps a stored refresh token for an access token and returns plain `Track` objects from Spotify's recently-played endpoint. A Next.js app route (`/api/spotify/recent`) reduces them to 12 distinct tracks and caches the response for an hour. A client component fetches the route and renders a `PageSection`, or nothing on failure. A local `npm run spotify-auth` script obtains the refresh token once.

**Tech Stack:** Next.js 13.4 (pages router for pages, app router for API routes), React 18, Jest + Testing Library, SCSS modules, LaunchDarkly React client SDK, esbuild (for the CLI script), 1Password CLI (`op run`), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-10-07-spotify-listening-section-design.md`

**Order note:** The spec lists "auth script and probe" first. This plan builds the Spotify shim (Task 1) before the auth script (Task 2), so the script can verify the new token through the same code the site uses. The probe gate still comes before any route, UI, or layout work.

## Global Constraints

- Every code file starts with two `// ABOUTME: ` lines (`# ABOUTME: ` in env files). Test files use the `/** ABOUTME ... */` block form seen in `__tests__/lib/publish/*.test.js`.
- 4-space indentation in all JS, JSX, JSON, SCSS.
- No lint exceptions (`eslint-disable`) without Chris's explicit approval. `npm run lint` must not report new errors; if it reports a new warning, stop and ask Chris.
- Test output must be pristine: tests that expect `console.error` must spy on it, silence it, and assert on it.
- Never mock the unit under test. Mock only HTTP (`fetch`) and Next.js framework boundaries, following existing tests.
- E2E tests use no mocks: real Spotify credentials, real LaunchDarkly flag.
- Section title is exactly `Listening`. Flag key is exactly `showRecentTracks`. Track limit is exactly 12. Spotify fetch is `limit=50`.
- Success cache header: `public, s-maxage=3600, stale-while-revalidate=86400`. Failure: status `502`, `Cache-Control: no-store`.
- Spotify redirect URI is `http://127.0.0.1:8888/callback` (Spotify rejects `localhost`). Scope is `user-read-recently-played`.
- Commit messages follow the repo style: `SPOTIFY-LISTENING: <summary>` and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Work on branch `spotify-listening` in `/Users/craser/dev/cjr/wk/raser.io`.

## Review Focus

1. **Local files in Spotify history** — a play of a local file has `track.id === null` and no `external_urls.spotify`; it must be skipped, not rendered as a dead link or crash. (Task 1 test.)
2. **Tracks with no album art** — `album.images` can be empty; the row must still render with title and artists and no broken `<img>`. (Task 1 and Task 6 tests.)
3. **Missing or wrong `SPOTIFY_*` env vars in production** — `SiteConfig` substitutes the literal string `"undefined"`; the token request then fails with HTTP 400. The route must return 502 `no-store` and log a message naming the token request and status, and the section must stay hidden. (Task 1 and Task 5 tests.)
4. **Flag off, or Spotify failing, on desktop** — the layout must fall back to exactly today's two-column GitHub | Previously layout with no empty third column. (Task 7 test for the empty slot; Task 8 e2e for real layout.)
5. **Fewer than 12 distinct tracks in history** (e.g. one song on repeat) — the list shows however many distinct tracks exist, newest first. (Task 4 test.)

---

### Task 1: Spotify shim (token request + client)

**Files:**
- Create: `lib/spotify/SpotifyAccounts.js`
- Create: `lib/spotify/SpotifyClient.js`
- Test: `__tests__/lib/spotify/SpotifyAccounts.test.js`
- Test: `__tests__/lib/spotify/SpotifyClient.test.js`

**Interfaces:**
- Produces:
    - `requestToken({ clientId, clientSecret, params, fetch = globalThis.fetch }) → Promise<object>` (Spotify's token JSON), exported from `@/lib/spotify/SpotifyAccounts`; also exports `TOKEN_URL`.
    - `default class SpotifyClient` from `@/lib/spotify/SpotifyClient`, constructed with `{ clientId, clientSecret, refreshToken, fetch = globalThis.fetch }`; method `getRecentlyPlayedTracks() → Promise<Track[]>`; also exports `RECENTLY_PLAYED_URL`.
    - `Track` = `{ id: string, title: string, artists: string[], url: string, albumImageUrl: string|null }`, newest play first, duplicates retained.

- [ ] **Step 1: Write the failing test for `requestToken`**

`__tests__/lib/spotify/SpotifyAccounts.test.js`:

```js
/**
 * ABOUTME: Tests for the Spotify Accounts token request shared by the site and the auth script.
 * ABOUTME: Injects a fake fetch; no network.
 *
 * @jest-environment node
 */

import { requestToken, TOKEN_URL } from '@/lib/spotify/SpotifyAccounts';

const fetchReturns = (status, body) => jest.fn().mockResolvedValue(new Response(body, { status }));

describe('requestToken', () => {
    test('posts the form parameters with Basic client credentials', async () => {
        const fetch = fetchReturns(200, JSON.stringify({ access_token: 'access' }));

        await requestToken({ clientId: 'id', clientSecret: 'secret', params: { grant_type: 'refresh_token', refresh_token: 'rt' }, fetch });

        expect(fetch).toHaveBeenCalledWith(TOKEN_URL, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from('id:secret').toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=refresh_token&refresh_token=rt',
            cache: 'no-store'
        });
    });

    test('resolves to the token response', async () => {
        const fetch = fetchReturns(200, JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }));

        const token = await requestToken({ clientId: 'id', clientSecret: 'secret', params: {}, fetch });

        expect(token).toEqual({ access_token: 'access', refresh_token: 'refresh' });
    });

    test('a refused request rejects with the status and Spotify\'s explanation', async () => {
        const fetch = fetchReturns(400, '{"error":"invalid_client"}');

        await expect(requestToken({ clientId: 'undefined', clientSecret: 'undefined', params: {}, fetch }))
            .rejects.toThrow('Spotify token request failed: HTTP 400 {"error":"invalid_client"}');
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/lib/spotify/SpotifyAccounts.test.js`
Expected: FAIL, `Cannot find module '@/lib/spotify/SpotifyAccounts'`.

- [ ] **Step 3: Implement `requestToken`**

`lib/spotify/SpotifyAccounts.js`:

```js
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- __tests__/lib/spotify/SpotifyAccounts.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing tests for `SpotifyClient`**

`__tests__/lib/spotify/SpotifyClient.test.js`:

```js
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
```

- [ ] **Step 6: Run them to verify they fail**

Run: `npm test -- __tests__/lib/spotify/SpotifyClient.test.js`
Expected: FAIL, `Cannot find module '@/lib/spotify/SpotifyClient'`.

- [ ] **Step 7: Implement `SpotifyClient`**

`lib/spotify/SpotifyClient.js`:

```js
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
```

- [ ] **Step 8: Run them to verify they pass**

Run: `npm test -- __tests__/lib/spotify/`
Expected: PASS (10 tests), no console output.

- [ ] **Step 9: Commit**

```bash
git add lib/spotify __tests__/lib/spotify
git commit -m "SPOTIFY-LISTENING: Spotify shim returns recently played tracks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `npm run spotify-auth` and the probe gate

**Files:**
- Create: `lib/spotify/authorization.js`
- Create: `scripts/spotify-auth.js`
- Create: `scripts/spotify/spotify.env`
- Modify: `package.json` (`scripts`)
- Test: `__tests__/lib/spotify/authorization.test.js`

**Interfaces:**
- Consumes: `requestToken` (Task 1), `SpotifyClient` (Task 1).
- Produces: `AUTH_PORT` (8888), `REDIRECT_URI`, `SCOPE`, `buildAuthorizeUrl({ clientId, state }) → string`, `readCallback(requestUrl, expectedState) → string` (the code), `exchangeCode({ clientId, clientSecret, code, fetch }) → Promise<string>` (the refresh token), all from `@/lib/spotify/authorization`.

- [ ] **Step 1: Write the failing tests**

`__tests__/lib/spotify/authorization.test.js`:

```js
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- __tests__/lib/spotify/authorization.test.js`
Expected: FAIL, `Cannot find module '@/lib/spotify/authorization'`.

- [ ] **Step 3: Implement the helpers**

`lib/spotify/authorization.js`:

```js
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
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npm test -- __tests__/lib/spotify/authorization.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Write the entry script, env file and npm scripts**

`scripts/spotify-auth.js`:

```js
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
```

`scripts/spotify/spotify.env`:

```
# ABOUTME: 1Password references for `npm run spotify-auth`, resolved by `op run`. Holds no secrets.
# ABOUTME: Edit the vault, item and field names to match the 1Password item.
SPOTIFY_CLIENT_ID=op://raser.io/raser.io spotify/client_id
SPOTIFY_CLIENT_SECRET=op://raser.io/raser.io spotify/client_secret
```

In `package.json` `scripts`, after `"blog-post"`, add (mirroring the blog-post entries):

```json
    "build:spotify-auth": "esbuild scripts/spotify-auth.js --bundle --platform=node --format=esm --packages=external --tsconfig=jsconfig.json --outfile=bin/spotify-auth.mjs",
    "prespotify-auth": "npm run build:spotify-auth",
    "spotify-auth": "op run --env-file scripts/spotify/spotify.env -- node bin/spotify-auth.mjs"
```

- [ ] **Step 6: Verify the script bundles**

Run: `npm run build:spotify-auth`
Expected: esbuild writes `bin/spotify-auth.mjs` with no errors (`bin/` is gitignored).

- [ ] **Step 7: Commit**

```bash
git add lib/spotify/authorization.js __tests__/lib/spotify/authorization.test.js scripts/spotify-auth.js scripts/spotify/spotify.env package.json
git commit -m "SPOTIFY-LISTENING: npm run spotify-auth obtains a refresh token

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: PROBE GATE — hand off to Chris and stop**

Claude must not run `npm run spotify-auth` itself: it prints a secret. Ask Chris to:

1. Create an app at https://developer.spotify.com/dashboard (needs active Premium) and add the redirect URI `http://127.0.0.1:8888/callback`.
2. Create the 1Password item `raser.io spotify` in the `raser.io` vault with fields `client_id` and `client_secret` (or edit `scripts/spotify/spotify.env` to match the item).
3. Run `npm run spotify-auth`, open the printed URL, approve.
4. Report the "Spotify returned N recently played tracks." line, or the error.
5. Store `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` in 1Password, in Vercel (all environments), and in `.env.local` for the dev server.

**If the probe fails (e.g. HTTP 403/404 from recently-played), STOP all work and regroup with Chris.** Continue only when N > 0.

---

### Task 3: Create the `showRecentTracks` flag in LaunchDarkly

No code. Uses Chris's signed-in LaunchDarkly session in the in-app browser (or Chrome, if Chris prefers). Claude never enters LaunchDarkly credentials; if not signed in, Chris signs in.

- [ ] **Step 1:** Open https://app.launchdarkly.com in the browser and confirm Chris is signed in to the project raser.io uses. Identify the project by checking that the existing `showLandingFrontpage` flag is there.
- [ ] **Step 2:** Start creating a flag: name `showRecentTracks`, key `showRecentTracks`, type boolean (variations `true` / `false`), and under client-side SDK availability check **"SDKs using Client-side ID"**. Before saving, show Chris the filled-in form and wait for his yes.
- [ ] **Step 3:** Save. Then, in **every** environment of the project (including Production), turn targeting **On** with the default rule serving `true`. Show Chris each environment's settings before saving each change, and wait for his yes.
- [ ] **Step 4:** Verify the client SDK can see it: with `npm run dev` running, open http://localhost:3000 in the browser, then use `read_network_requests` with `urlPattern: "launchdarkly"` and read the flag-evaluation response body. It must contain `showRecentTracks` with value `true`. If the flag is absent, the client-side availability box was not checked; fix it in the LaunchDarkly UI, showing Chris the change first. Record the result in the task report.

---

### Task 4: Distinct-track selection

**Files:**
- Create: `lib/spotify/selectDistinctTracks.js`
- Test: `__tests__/lib/spotify/selectDistinctTracks.test.js`

**Interfaces:**
- Consumes: `Track` shape (Task 1); only `id` is read.
- Produces: `default function selectDistinctTracks(tracks, limit) → Track[]` from `@/lib/spotify/selectDistinctTracks`.

- [ ] **Step 1: Write the failing tests**

```js
/**
 * ABOUTME: Tests for reducing a newest-first play history to its most recent distinct tracks.
 * ABOUTME: Pure function; no mocks.
 */

import selectDistinctTracks from '@/lib/spotify/selectDistinctTracks';

const tracks = (...ids) => ids.map((id) => ({ id, title: `title ${id}` }));
const ids = (list) => list.map((t) => t.id);

describe('selectDistinctTracks', () => {
    test('keeps each track once, at the position of its most recent play', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'b', 'a', 'c', 'b'), 12))).toEqual(['a', 'b', 'c']);
    });

    test('stops at the limit', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'b', 'c', 'd'), 2))).toEqual(['a', 'b']);
    });

    test('counts distinct tracks, not plays, toward the limit', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'a', 'a', 'b', 'c'), 2))).toEqual(['a', 'b']);
    });

    test('returns fewer than the limit when history is short, e.g. one song on repeat', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'a', 'a'), 12))).toEqual(['a']);
    });

    test('empty history gives an empty list', () => {
        expect(selectDistinctTracks([], 12)).toEqual([]);
    });

    test('returns the track objects themselves', () => {
        const history = tracks('a');
        expect(selectDistinctTracks(history, 12)[0]).toBe(history[0]);
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- __tests__/lib/spotify/selectDistinctTracks.test.js`
Expected: FAIL, `Cannot find module`.

- [ ] **Step 3: Implement**

`lib/spotify/selectDistinctTracks.js`:

```js
// ABOUTME: Reduces a newest-first play history to its most recent distinct tracks.
// ABOUTME: A track played several times appears once, where its most recent play was.

/**
 * @param {Track[]} tracks newest play first
 * @param {number} limit maximum number of tracks to return
 * @returns {Track[]}
 */
export default function selectDistinctTracks(tracks, limit) {
    const distinct = new Map();
    for (const track of tracks) {
        if (distinct.size === limit) {
            break;
        }
        if (!distinct.has(track.id)) {
            distinct.set(track.id, track);
        }
    }
    return [...distinct.values()];
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npm test -- __tests__/lib/spotify/selectDistinctTracks.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/spotify/selectDistinctTracks.js __tests__/lib/spotify/selectDistinctTracks.test.js
git commit -m "SPOTIFY-LISTENING: select the most recent distinct tracks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Configuration and `/api/spotify/recent` route

**Files:**
- Modify: `siteconfig.json` (add `spotify` block after the `github` block, ~line 65)
- Modify: `lib/SiteConfig.js` (`#processEnv`)
- Create: `app/api/spotify/recent/route.js`
- Test: `__tests__/app/api/spotify/recent/route.test.js`
- Test: `__tests__/lib/SiteConfig.test.js` (add cases)

**Interfaces:**
- Consumes: `SpotifyClient` (Task 1), `selectDistinctTracks` (Task 4).
- Produces: config keys `spotify.clientId`, `spotify.clientSecret`, `spotify.refreshToken`, `spotify.endpoints.recent` (`/api/spotify/recent`); route `GET /api/spotify/recent` → `200 { tracks: Track[] }` (≤12, distinct) or `502 { error: string }`.

- [ ] **Step 1: Write failing SiteConfig tests**

Read `__tests__/lib/SiteConfig.test.js` first and match its setup for env vars. Add:

```js
    test('reads the Spotify credentials from the environment', () => {
        process.env.SPOTIFY_CLIENT_ID = 'spotify-id';
        process.env.SPOTIFY_CLIENT_SECRET = 'spotify-secret';
        process.env.SPOTIFY_REFRESH_TOKEN = 'spotify-refresh';
        const SiteConfig = require('@/lib/SiteConfig').default;
        const config = new SiteConfig();

        expect(config.getValue('spotify.clientId')).toBe('spotify-id');
        expect(config.getValue('spotify.clientSecret')).toBe('spotify-secret');
        expect(config.getValue('spotify.refreshToken')).toBe('spotify-refresh');
    });

    test('knows the Spotify recent tracks endpoint', () => {
        const SiteConfig = require('@/lib/SiteConfig').default;
        expect(new SiteConfig().getValue('spotify.endpoints.recent')).toBe('/api/spotify/recent');
    });
```

If the existing file imports `SiteConfig` at the top and sets env differently (e.g. `jest.resetModules()` in `beforeEach`), follow its pattern instead of `require`; `#processEnv` is captured per instance, so setting `process.env` before `new SiteConfig()` is enough.

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- __tests__/lib/SiteConfig.test.js`
Expected: the two new tests FAIL (`getValue` returns undefined / `Cannot read properties of undefined`).

- [ ] **Step 3: Add the config**

In `siteconfig.json`, after the `"github": { ... },` block:

```json
  "spotify": {
    "clientId": "{SPOTIFY_CLIENT_ID}",
    "clientSecret": "{SPOTIFY_CLIENT_SECRET}",
    "refreshToken": "{SPOTIFY_REFRESH_TOKEN}",
    "endpoints": {
      "recent": "/api/spotify/recent"
    }
  },
```

(Match the file's existing indentation exactly; it uses 2 spaces. Per the rule that consistency within a file wins, keep 2 spaces there.)

In `lib/SiteConfig.js` `#processEnv`, after `GITHUB_USERNAME`:

```js
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
        SPOTIFY_REFRESH_TOKEN: process.env.SPOTIFY_REFRESH_TOKEN,
```

- [ ] **Step 4: Run SiteConfig tests to verify they pass**

Run: `npm test -- __tests__/lib/SiteConfig.test.js`
Expected: PASS.

- [ ] **Step 5: Write the failing route tests**

`__tests__/app/api/spotify/recent/route.test.js`. Follows `__tests__/app/api/github/recent/route.test.js`: mocks `next/server` and `SiteConfig`; the Spotify shim runs for real against a mocked `global.fetch`.

```js
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

    beforeEach(() => {
        jest.clearAllMocks();
        NextResponse = require('next/server').NextResponse;
        NextResponse.mockImplementation((body, init) => ({ body, status: init.status, headers: init.headers }));
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
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
```

- [ ] **Step 6: Run them to verify they fail**

Run: `npm test -- __tests__/app/api/spotify/recent/route.test.js`
Expected: FAIL, `Cannot find module '@/app/api/spotify/recent/route'`.

- [ ] **Step 7: Implement the route**

`app/api/spotify/recent/route.js`:

```js
// ABOUTME: GET /api/spotify/recent: the tracks Chris most recently played on Spotify, for the front page.
// ABOUTME: Returns up to 12 distinct tracks cached for an hour, or an uncached 502 when Spotify can't be reached.

import { NextResponse } from "next/server";
import SiteConfig from "@/lib/SiteConfig";
import SpotifyClient from "@/lib/spotify/SpotifyClient";
import selectDistinctTracks from "@/lib/spotify/selectDistinctTracks";

const TRACK_LIMIT = 12;

// Caching is controlled by the Cache-Control header alone; never prerender this at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
    const config = new SiteConfig();
    const spotify = new SpotifyClient({
        clientId: config.getValue('spotify.clientId'),
        clientSecret: config.getValue('spotify.clientSecret'),
        refreshToken: config.getValue('spotify.refreshToken')
    });
    try {
        const tracks = selectDistinctTracks(await spotify.getRecentlyPlayedTracks(), TRACK_LIMIT);
        return new NextResponse(JSON.stringify({ tracks }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
        });
    } catch (error) {
        console.error('Error fetching recently played tracks from Spotify:', error);
        return new NextResponse(JSON.stringify({ error: 'Spotify is unavailable' }), {
            status: 502,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    }
}
```

- [ ] **Step 8: Run them to verify they pass, then run the whole suite**

Run: `npm test -- __tests__/app/api/spotify/recent/route.test.js`
Expected: PASS (4 tests), no console output.
Run: `npm test`
Expected: all suites PASS, no new console noise.

- [ ] **Step 9: Commit**

```bash
git add siteconfig.json lib/SiteConfig.js app/api/spotify __tests__/app/api/spotify __tests__/lib/SiteConfig.test.js
git commit -m "SPOTIFY-LISTENING: /api/spotify/recent serves the last 12 distinct tracks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `RecentTracks` component

**Files:**
- Create: `components/spotify/RecentTracks.jsx`
- Create: `components/spotify/RecentTracks.module.scss`
- Test: `__tests__/components/spotify/RecentTracks.test.js`

**Interfaces:**
- Consumes: `GET /api/spotify/recent` (Task 5) via `spotify.endpoints.recent`; `PageSection` (`components/frontpage/PageSection.jsx`).
- Produces: `default function RecentTracks()` from `@/components/spotify/RecentTracks`; renders a `PageSection` (a `<section>`) titled `Listening`, or `null`.

- [ ] **Step 1: Write the failing tests**

```js
/**
 * ABOUTME: Tests for the front page "Listening" section.
 * ABOUTME: Mocks global fetch and the lucide icon; renders the real PageSection.
 */

import { render, screen, waitFor } from '@testing-library/react';
import RecentTracks from '@/components/spotify/RecentTracks';

jest.mock('lucide-react', () => ({
    Music: () => <b>music icon</b>
}));

const track = (id, overrides = {}) => ({
    id,
    title: `Title ${id}`,
    artists: ['Artist One', 'Artist Two'],
    url: `https://open.spotify.com/track/${id}`,
    albumImageUrl: `https://i.scdn.co/image/${id}`,
    ...overrides
});

function apiReturns(response) {
    global.fetch = jest.fn().mockResolvedValue(response);
}

describe('RecentTracks', () => {
    let consoleError;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    test('fetches the recent tracks endpoint', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [] }) });
        render(<RecentTracks/>);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/spotify/recent'));
    });

    test('renders a "Listening" section with a linked row per track', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [track('a'), track('b')] }) });
        render(<RecentTracks/>);

        expect(await screen.findByRole('heading', { name: 'Listening' })).toBeInTheDocument();
        const links = screen.getAllByRole('link');
        expect(links.map((l) => l.getAttribute('href'))).toEqual(['https://open.spotify.com/track/a', 'https://open.spotify.com/track/b']);
        expect(links[0]).toHaveTextContent('Title a');
        expect(links[0]).toHaveTextContent('Artist One, Artist Two');
    });

    test('shows each album thumbnail', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [track('a')] }) });
        const { container } = render(<RecentTracks/>);

        await screen.findByRole('heading', { name: 'Listening' });
        expect(container.querySelector('img').getAttribute('src')).toBe('https://i.scdn.co/image/a');
    });

    test('a track without album art renders without an image', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [track('a', { albumImageUrl: null })] }) });
        const { container } = render(<RecentTracks/>);

        await screen.findByRole('heading', { name: 'Listening' });
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByRole('link')).toHaveTextContent('Title a');
    });

    test('renders nothing while loading', () => {
        global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
        const { container } = render(<RecentTracks/>);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders nothing when there are no tracks', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [] }) });
        const { container } = render(<RecentTracks/>);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    test('renders nothing, and logs, when the API fails', async () => {
        apiReturns({ ok: false, status: 502, json: () => Promise.resolve({ error: 'Spotify is unavailable' }) });
        const { container } = render(<RecentTracks/>);

        await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Failed to fetch recent tracks: HTTP 502' })
        ));
        expect(container).toBeEmptyDOMElement();
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- __tests__/components/spotify/RecentTracks.test.js`
Expected: FAIL, `Cannot find module '@/components/spotify/RecentTracks'`.

- [ ] **Step 3: Implement the component and styles**

`components/spotify/RecentTracks.jsx`:

```jsx
// ABOUTME: Front page "Listening" section: the tracks Chris most recently played on Spotify.
// ABOUTME: Renders nothing until tracks arrive, so a failed or empty fetch leaves no trace on the page.

import styles from './RecentTracks.module.scss';
import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import PageSection from '@/components/frontpage/PageSection';
import SiteConfig from '@/lib/SiteConfig';

function TrackRow({ track }) {
    return (
        <li className={styles.track}>
            <a className={styles.trackLink} href={track.url}>
                {track.albumImageUrl &&
                    <img className={styles.albumImage} src={track.albumImageUrl} alt="" width={48} height={48}/>
                }
                <span className={styles.trackText}>
                    <span className={styles.title}>{track.title}</span>
                    <span className={styles.artists}>{track.artists.join(', ')}</span>
                </span>
            </a>
        </li>
    );
}

export default function RecentTracks() {
    const [tracks, setTracks] = useState([]);

    useEffect(() => {
        fetch(new SiteConfig().getValue('spotify.endpoints.recent'))
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch recent tracks: HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(({ tracks }) => setTracks(tracks))
            .catch((error) => console.error(error));
    }, []);

    if (tracks.length === 0) {
        return null;
    }
    return (
        <PageSection title="Listening" BgIcon={Music}>
            <ul className={styles.trackList}>
                {tracks.map((track) => <TrackRow key={track.id} track={track}/>)}
            </ul>
        </PageSection>
    );
}
```

`components/spotify/RecentTracks.module.scss` (visual language borrowed from `PreviousPosts.module.scss` — rounded thumbnails, white hover outline):

```scss
// ABOUTME: Styles for the front page "Listening" section's track list.
// ABOUTME: Compact rows: album thumbnail, then title over artists.

.trackList {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}

.trackLink {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75em;
    padding: 6px;
    border: 1px solid transparent;
    border-radius: 5px;
    color: inherit;
    text-decoration: none;

    &:hover {
        border-color: white;
        background-color: rgba(255, 255, 255, 0.2);
    }
}

.albumImage {
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: 5px;
    object-fit: cover;
}

.trackText {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.title,
.artists {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.title {
    font-weight: bold;
}

.artists {
    font-size: 0.9em;
    opacity: 0.8;
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npm test -- __tests__/components/spotify/RecentTracks.test.js`
Expected: PASS (7 tests), no console output.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors. If it reports a **new** warning for `components/spotify/RecentTracks.jsx` (e.g. `@next/next/no-img-element`), check whether the same warning already appears for `components/frontpage/YouTubeTitleImage.jsx`. Either way, STOP and ask Chris how to proceed. Do not add `eslint-disable`.

- [ ] **Step 6: Commit**

```bash
git add components/spotify __tests__/components/spotify
git commit -m "SPOTIFY-LISTENING: RecentTracks renders the Listening section

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Layout, page, flag, and `SocialFeed` cleanup

**Files:**
- Modify: `components/templates/FrontLandingLayout.jsx`
- Modify: `components/templates/FrontLandingLayout.module.scss` (the `.tier2` block)
- Modify: `pages/index.js`
- Modify: `__tests__/pages/index.test.js`
- Delete: `components/frontpage/SocialFeed.jsx`, `components/frontpage/SocialFeed.module.scss`
- Test: `__tests__/components/templates/FrontLandingLayout.test.js` (create)

**Interfaces:**
- Consumes: `RecentTracks` (Task 6); `FeatureEnabled` (`components/flags/FeatureEnabled.js`, props `feature`, `children`, `override`).
- Produces: `FrontLandingLayout({ latest, github, listening, previous })`. The `social` prop no longer exists.

**Layout approach:** `.tier2` is `column-reverse` on mobile and a row at ≥800px. The layout wraps `listening` in `<div className={styles.listening}>` so it can carry a flex `order` (to put it at the top of the mobile stack, since `column-reverse` shows the highest `order` first) and be hidden with `:empty` when the flag is off or the section renders nothing. Desktop sizing changes from `width/min-width/max-width` on `section` to `flex: 1 1 0` on each column, so two or three columns share the row evenly.

- [ ] **Step 1: Write the failing layout tests**

`__tests__/components/templates/FrontLandingLayout.test.js`:

```js
/**
 * ABOUTME: Tests for the landing front page layout's slots and their order.
 * ABOUTME: Mocks StandardLayout to render its content directly; CSS ordering is covered by the e2e test.
 */

import { render, screen } from '@testing-library/react';
import FrontLandingLayout from '@/components/templates/FrontLandingLayout';

jest.mock('@/components/templates/StandardLayout', () => ({
    __esModule: true,
    default: ({ content }) => <div data-testid="standard-layout">{content}</div>
}));

const slots = {
    latest: <div data-testid="latest"/>,
    github: <section data-testid="github"/>,
    listening: <section data-testid="listening"/>,
    previous: <section data-testid="previous"/>
};

describe('FrontLandingLayout', () => {
    test('places listening between github and previous', () => {
        render(<FrontLandingLayout {...slots}/>);

        const order = ['github', 'listening', 'previous'].map((id) => screen.getByTestId(id));
        expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(order[1].compareDocumentPosition(order[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('wraps listening so the stylesheet can reorder it on mobile', () => {
        render(<FrontLandingLayout {...slots}/>);
        expect(screen.getByTestId('listening').parentElement).toHaveClass('listening');
    });

    test('leaves the listening wrapper empty when there is nothing to show, so CSS can hide it', () => {
        const { container } = render(<FrontLandingLayout {...slots} listening={null}/>);
        expect(container.querySelector('.listening')).toBeEmptyDOMElement();
    });

    test('has no social slot', () => {
        render(<FrontLandingLayout {...slots} social={<div data-testid="social"/>}/>);
        expect(screen.queryByTestId('social')).toBeNull();
    });
});
```

(`identity-obj-proxy` maps `styles.listening` to the class name `listening`.)

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- __tests__/components/templates/FrontLandingLayout.test.js`
Expected: the first three FAIL (no `listening` rendered); "has no social slot" passes already, since the layout never rendered `social`.

- [ ] **Step 3: Update the layout component**

In `components/templates/FrontLandingLayout.jsx`, change the signature and `.tier2` contents:

```jsx
export default function FrontLandingLayout({ latest, github, listening, previous }) {
```

```jsx
                <div className={styles.tier2}>
                    {github}
                    <div className={styles.listening}>{listening}</div>
                    {previous}
                </div>
```

Leave the rest of the file (including the scroll comment and `useEffect`) unchanged.

- [ ] **Step 4: Run them to verify they pass**

Run: `npm test -- __tests__/components/templates/FrontLandingLayout.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Update the stylesheet**

In `components/templates/FrontLandingLayout.module.scss`, inside `.tier2`, add after the `&:before { ... }` block:

```scss
            /*
             * Mobile stacks the columns with column-reverse, so the highest order lands on top.
             * Empty when the flag is off or there's nothing to list; hide it so it takes no space.
             */
            .listening {
                order: 1;

                &:empty {
                    display: none;
                }
            }
```

and replace the existing desktop media query:

```scss
            @media only screen and (min-width: 800px) {
                flex-direction: row;

                section {
                    width: 100%;
                    max-width: 50%;
                    min-width: 40%;
                    z-index: 1;
                }

            }
```

with:

```scss
            @media only screen and (min-width: 800px) {
                flex-direction: row;

                /* Two or three columns share the row evenly, depending on whether listening is shown. */
                > section,
                > .listening {
                    flex: 1 1 0;
                    min-width: 0;
                    z-index: 1;
                }

                .listening {
                    order: 0;
                }

            }
```

- [ ] **Step 6: Write the failing page tests**

In `__tests__/pages/index.test.js`:

1. Change the `FrontLandingLayout` mock to render all three tier-2 slots:

```js
jest.mock('@/components/templates/FrontLandingLayout', () => ({
    __esModule: true,
    default: ({ latest, github, listening, previous }) => <div data-testid="front-landing">{latest}{github}{listening}{previous}</div>
}));
```

2. Replace the `SocialFeed` mock with a `RecentTracks` mock:

```js
jest.mock('@/components/spotify/RecentTracks', () => ({
    __esModule: true,
    default: () => <div data-testid="recent-tracks"/>
}));
```

3. Change the `FeatureEnabled` mock so it records every feature it gates:

```js
jest.mock('@/components/flags/FeatureEnabled', () => ({
    __esModule: true,
    default: ({ feature, children, override }) => {
        captured.featureEnabledOverride = captured.featureEnabledOverride ?? override;
        captured.enabledFeatures = [...(captured.enabledFeatures ?? []), feature];
        return <div data-testid={`feature-enabled-${feature}`}>{children}</div>;
    }
}));
```

Update `renders without any props` to look up `front-landing` (unchanged) — no other existing assertion uses the `feature-enabled` test id; confirm with `grep -n "feature-enabled" __tests__/pages/index.test.js`.

4. Add tests:

```js
    it('shows recent tracks only behind the showRecentTracks flag', () => {
        const { getByTestId } = render(<Home/>);
        expect(captured.enabledFeatures).toContain('showRecentTracks');
        expect(getByTestId('feature-enabled-showRecentTracks')).toContainElement(getByTestId('recent-tracks'));
    });

    it('no longer renders the social feed placeholder', () => {
        expect(() => require('@/components/frontpage/SocialFeed')).toThrow();
    });
```

- [ ] **Step 7: Run them to verify they fail**

Run: `npm test -- __tests__/pages/index.test.js`
Expected: the two new tests FAIL (no `showRecentTracks`; `SocialFeed` still exists).

- [ ] **Step 8: Update the page and delete `SocialFeed`**

In `pages/index.js`: remove the `SocialFeed` import, add `import RecentTracks from "@/components/spotify/RecentTracks";`, and replace `social={<SocialFeed/>}` with:

```jsx
                    listening={
                        <FeatureEnabled feature='showRecentTracks'>
                            <RecentTracks/>
                        </FeatureEnabled>
                    }
```

Then:

```bash
git rm components/frontpage/SocialFeed.jsx components/frontpage/SocialFeed.module.scss
```

- [ ] **Step 9: Run the page tests, then everything**

Run: `npm test -- __tests__/pages/index.test.js`
Expected: PASS.
Run: `npm test && npm run lint`
Expected: all PASS, no new lint errors or warnings, no console noise.

- [ ] **Step 10: Commit**

```bash
git add components/templates pages/index.js __tests__/pages/index.test.js __tests__/components/templates/FrontLandingLayout.test.js
git commit -m "SPOTIFY-LISTENING: Listening section joins the front page behind showRecentTracks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Playwright end-to-end test

**Prerequisites:** Task 2's probe passed and `.env.local` holds real `SPOTIFY_*` values; Task 3's flag is on; the `showLandingFrontpage` flag is on in the environment `.env.local`'s LaunchDarkly client-side ID points at (the landing layout must render).

**Files:**
- Modify: `package.json` (devDependency, `test:e2e` script)
- Create: `playwright.config.js`
- Create: `e2e/listening.spec.js`

**Interfaces:**
- Consumes: the running site; section titles `Recent Github Activity`, `Listening`, `Previously` (from `GithubActivity.jsx`, `RecentTracks.jsx`, `PreviousPosts.jsx`), each rendered as an `h2` inside a `section` by `PageSection`.

- [ ] **Step 1: Install Playwright**

Run: `npm install --save-dev --save-exact @playwright/test`
Then: `npx playwright install chromium` (browsers are cached under `~/Library/Caches/ms-playwright`; this is quick if the matching build is already there).

Jest only collects `__tests__/**/*.test.*`, so `e2e/*.spec.js` stays out of `npm test`.

- [ ] **Step 2: Add the config and script**

`playwright.config.js`:

```js
// ABOUTME: Playwright configuration for end-to-end tests against the real site, real APIs and real flags.
// ABOUTME: Starts `npm run dev` unless a dev server is already running on port 3000.

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 60000,
    use: {
        baseURL: 'http://localhost:3000'
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } }
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000
    }
});
```

In `package.json` `scripts`, after `"test:coverage:open"`:

```json
    "test:e2e": "playwright test",
```

- [ ] **Step 3: Write the e2e test**

`e2e/listening.spec.js`:

```js
// ABOUTME: End-to-end test of the front page Listening section against real Spotify data and real LaunchDarkly flags.
// ABOUTME: Checks that tracks render and that the section sits between GitHub and Previously (desktop) or above them (mobile).

const { test, expect } = require('@playwright/test');

const section = (page, title) => page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) });

test('the Listening section lists recently played tracks linked to Spotify', async ({ page }) => {
    await page.goto('/');

    const listening = section(page, 'Listening');
    await expect(listening).toBeVisible({ timeout: 30000 });
    const links = listening.locator('a[href^="https://open.spotify.com/track/"]');
    expect(await links.count()).toBeGreaterThan(0);
    expect(await links.count()).toBeLessThanOrEqual(12);
});

test('the Listening section is placed for the viewport', async ({ page }, testInfo) => {
    await page.goto('/');

    const github = section(page, 'Recent Github Activity');
    const listening = section(page, 'Listening');
    const previous = section(page, 'Previously');
    await expect(listening).toBeVisible({ timeout: 30000 });
    await expect(github).toBeVisible({ timeout: 30000 });
    await expect(previous).toBeVisible({ timeout: 30000 });

    const [g, l, p] = await Promise.all([github, listening, previous].map((s) => s.boundingBox()));
    if (testInfo.project.name === 'desktop') {
        expect(g.x).toBeLessThan(l.x);
        expect(l.x).toBeLessThan(p.x);
    } else {
        expect(l.y).toBeLessThan(p.y);
        expect(l.y).toBeLessThan(g.y);
    }
});
```

- [ ] **Step 4: Verify the test fails when the feature is absent**

Temporarily stash the Task 7 page change to prove the test can fail: `git stash push pages/index.js`, run `npm run test:e2e`, expect FAIL (`Listening` not visible), then `git stash pop`. If a dev server was already running, restart it between runs so it picks up the change.

- [ ] **Step 5: Run it for real**

Run: `npm run test:e2e`
Expected: 4 passing (2 tests × desktop and mobile). If the Listening section is not visible, check the dev server log for `Error fetching recently played tracks from Spotify:` and that the flags are on. Do not change the test to get it to pass.

- [ ] **Step 6: Make sure Playwright output stays out of git**

`playwright-report` is already in `.gitignore`. Run `git status --short` and, if `test-results/` shows as untracked, add `test-results` to `.gitignore` next to the `playwright-report` line.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json playwright.config.js e2e .gitignore
git commit -m "SPOTIFY-LISTENING: end-to-end test of the Listening section with real Spotify data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] `npm test` — all pass, pristine output.
- [ ] `npm run lint` — no new errors or warnings.
- [ ] `npm run build` — succeeds, and the build output lists `/api/spotify/recent` as dynamic (λ), not static (○).
- [ ] `npm run test:e2e` — all pass.
- [ ] Look at the front page in the browser at desktop and mobile widths, with the flag on and (temporarily, in a local LaunchDarkly override or by blanking `SPOTIFY_REFRESH_TOKEN` in `.env.local`) with Spotify failing, to confirm the two-column fallback looks like today's page. Restore `.env.local` afterwards.
