# Spotify "Listening" Front Page Section — Design

Date: 2026-10-07
Branch: `spotify-listening`

## Purpose

Add a small bit of personality to the landing front page: a short list of what Chris has been listening to on
Spotify lately. It is not a listening log — no history, play counts, or timestamps.

## Requirements

- Show the **last 12 distinct tracks** Chris played, newest first. Repeat plays collapse into one entry at the
  position of the track's most recent play.
- Each entry shows a **small album-art thumbnail, the track title, and the artist(s)**, and links to the track on
  Spotify. No played-at timestamp.
- The section's visible title is **"Listening"**.
- The section replaces the unused `social` slot of `FrontLandingLayout`.
    - **Desktop (≥800px):** rendered between the GitHub and Previously sections (GitHub | Listening | Previously).
    - **Mobile:** rendered above both.
- Data freshness: cached for **about an hour**, with stale-while-revalidate so visitors never wait on Spotify.
- On **any failure** (revoked token, Spotify outage, empty history), the section is **hidden entirely** and the
  server logs the reason. It never renders empty or flashes and disappears.
- The section is gated by a **LaunchDarkly feature flag**, `showRecentTracks`. An absent flag means disabled.
  Claude creates the flag as part of this work (see Implementation Order) and turns it **on in every environment,
  including production**; it has no effect until the code is merged. The flag must have **"Available to SDKs using
  Client-side ID"** enabled, or the React client SDK cannot see it.
- The one-time Spotify authorization is done with a **local script**, not a deployed callback route.

## External Constraints (Spotify, as of 2026)

- Development Mode apps require the app owner to have an **active Spotify Premium subscription**. If it lapses, the
  app stops working; the section then hides itself per the failure rule.
- Development Mode is limited to 5 users. Only Chris's account is used.
- Redirect URIs may not use `localhost`. Loopback must be an explicit IP literal: `http://127.0.0.1:<port>`.
- The Feb 2026 migration guide does not list Get Recently Played Tracks among removed endpoints, but this was not
  confirmed directly. **The first implementation step is a probe against the real API** (see Implementation
  Order). If the endpoint is unavailable, work stops and we regroup.

## Architecture

### Configuration

- `siteconfig.json` gains a `spotify` block:

  ```json
  "spotify": {
    "clientId": "{SPOTIFY_CLIENT_ID}",
    "clientSecret": "{SPOTIFY_CLIENT_SECRET}",
    "refreshToken": "{SPOTIFY_REFRESH_TOKEN}",
    "endpoints": {
      "recent": "/api/spotify/recent"
    }
  }
  ```

- `SiteConfig`'s `#processEnv` gains `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`.
  These are server-only (no `NEXT_PUBLIC_` prefix).
- Chris stores the three values in Vercel's environment variables and in 1Password.

### Spotify shim (`lib/spotify/`)

A generically-named wrapper around the Spotify Web API, so nothing outside it sees Spotify's raw JSON.

- `getRecentlyPlayedTracks()`:
    1. Exchanges the refresh token for an access token:
       `POST https://accounts.spotify.com/api/token` with `grant_type=refresh_token`, authenticated with HTTP Basic
       (`clientId:clientSecret`). If the response includes a rotated `refresh_token`, it is ignored; the configured
       token continues to be used.
    2. Calls `GET https://api.spotify.com/v1/me/player/recently-played?limit=50`.
    3. Maps each play's `track` to a plain `Track` object:
       `{ id, title, artists, url, albumImageUrl }` where `artists` is an array of artist names, `url` is
       `external_urls.spotify`, and `albumImageUrl` is the smallest image in `album.images` (Spotify sorts them
       widest first).
    4. Returns the plays newest first (Spotify's order), as `Track[]`.
- Any non-OK response from either call rejects with an `Error` describing which call failed and its status.
- All `fetch` calls pass `cache: 'no-store'` so Next.js's fetch cache does not cache tokens or responses; HTTP
  caching is controlled solely by the route's `Cache-Control` header.
- Fetching 50 plays gives headroom for repeats when reducing to 12 distinct tracks.

### Distinct-track selection

A small pure function, e.g. `selectDistinctTracks(tracks, limit)`: walks the newest-first list, keeps the first
occurrence of each track `id`, and stops at `limit` (12). Returns fewer than `limit` if history is short.

### API route (`app/api/spotify/recent/route.js`)

- `GET` calls `getRecentlyPlayedTracks()`, applies `selectDistinctTracks(…, 12)`, and returns `{ tracks }` with
  `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- `export const dynamic = 'force-dynamic'` so Next.js does not prerender the route at build time.
- On any error: logs it with `console.error` and returns a `502` with `Cache-Control: no-store`, so failures are not
  cached at the edge.
- The route is not flag-gated; it exposes only what the section would display.

### Component (`components/spotify/RecentTracks.jsx`)

- Modeled on `GithubActivity`. On mount, fetches the URL from `SiteConfig` (`spotify.endpoints.recent`).
- Renders a `PageSection` titled "Listening" with a `lucide-react` music icon as `BgIcon`.
- Each row: thumbnail image, title, and artists joined with `", "`; the whole row links to the track's Spotify URL.
- Renders **nothing** while loading, on a failed/non-OK fetch, or when `tracks` is empty.
- Styles in `components/spotify/RecentTracks.module.scss`.

### Page and layout

- `pages/index.js`: removes `SocialFeed`; passes
  `listening={<FeatureEnabled feature='showRecentTracks'><RecentTracks/></FeatureEnabled>}` to `FrontLandingLayout`.
  When the flag is off, the component never mounts and never calls the API.
- `FrontLandingLayout`: the `social` prop is replaced by `listening`, rendered inside `.tier2` between `github` and
  `previous`.
- `FrontLandingLayout.module.scss`:
    - Desktop: `section` widths change so three sections fit in one row (roughly a third each). The two-section
      layout (flag off) must still look right.
    - Mobile: the listening section gets an `order` that places it at the top of the `column-reverse` stack; the
      order is reset at ≥800px so it sits in the middle on desktop.

### Cleanup

- Delete `components/frontpage/SocialFeed.jsx` and `components/frontpage/SocialFeed.module.scss`.
- Remove the `SocialFeed` mock from `__tests__/pages/index.test.js`.
- `app/api/social/recent/route.js` is left untouched.

### One-time authorization script (`scripts/spotify-auth.js`, `npm run spotify-auth`)

- Reads `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from the environment.
- Starts a temporary HTTP server on `127.0.0.1:<fixed port>` and prints/opens the Spotify authorize URL with scope
  `user-read-recently-played` and redirect URI `http://127.0.0.1:<port>/callback` (registered in the Spotify app
  dashboard). Includes a random `state` value and rejects callbacks whose `state` does not match.
- On callback, exchanges the code for tokens, prints the refresh token, and exits.
- Nothing from this script is deployed.

## Testing

Following TDD for every unit.

### Unit / integration (Jest)

- **`selectDistinctTracks`:** distinct by `id`; most recent play wins position; caps at the limit; returns fewer when
  history is short; empty input → empty output.
- **Spotify shim:** mocks only the HTTP boundary (`fetch`), never the shim. Verifies the token exchange request
  (Basic auth, grant type), the recently-played request (bearer token, `limit=50`), mapping to `Track` (including
  smallest-image selection and multiple artists), and that a failed token exchange or API call rejects.
- **Route:** success returns `{ tracks }` (≤12, distinct) with the 1-hour cache headers; failure returns `502` with
  `no-store` and logs the error. Tests that expect logged errors capture and assert on them so output stays pristine.
- **`RecentTracks`:** renders "Listening", thumbnails, titles, artists, and links; renders nothing while loading, on
  failed fetch, and on empty list.
- **Auth script:** building the authorize URL (client id, scope, redirect URI, `state`); rejecting a callback with a
  mismatched `state`; exchanging the code for tokens (HTTP boundary mocked).
- **Layout / page:** the listening section renders between GitHub and Previously in DOM order; it is absent when the
  flag is off; `SocialFeed` is gone.

### End-to-end (Playwright)

- Add a minimal Playwright setup (config + `npm` script) scoped to this feature; it does not settle the broader
  Playwright question left open by `36fc0ae`.
- One e2e spec against a dev server running with **real** `SPOTIFY_*` credentials and the `showRecentTracks` flag
  enabled in the LaunchDarkly environment the dev server uses. No mocks.
- Verifies the "Listening" section appears with at least one track link pointing to `open.spotify.com`.
- Verifies ordering at two viewports: desktop (GitHub, Listening, Previously left to right) and mobile (Listening
  visually above Previously and GitHub).

## Implementation Order

1. **Auth script and probe:** build `npm run spotify-auth`; Chris creates the Spotify app and runs it; then a single
   request confirms `GET /v1/me/player/recently-played` returns tracks in Development Mode. Stop and regroup if it
   does not.
2. **Feature flag:** Claude creates the boolean flag `showRecentTracks` in the LaunchDarkly web UI, using Chris's
   signed-in browser session, with client-side SDK availability enabled, and turns it on in all environments.
   Claude shows Chris the flag settings before saving.
3. Distinct-track selection, Spotify shim, config.
4. API route.
5. `RecentTracks` component.
6. Layout, page, flag, and `SocialFeed` cleanup.
7. Playwright setup and e2e spec.

## Chris's Manual Steps

- Create the Spotify app in the developer dashboard (requires active Premium) and register the
  `http://127.0.0.1:<port>/callback` redirect URI.
- Run `npm run spotify-auth`; store `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` in Vercel
  and 1Password.
