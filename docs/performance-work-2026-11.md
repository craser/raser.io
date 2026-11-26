# Performance work, November 24–25, 2026

This covers the performance changes merged in PRs #79–#84 and #92–#94. PRs #85–#91 from the same days were styling changes and aren't covered here.

## What we did

### Measurement

- **Added real-user Core Web Vitals tracking (#76).** `<SpeedInsights />` in `pages/_app.js` reports LCP, INP and CLS from production on every route. It went in first so the later changes have a baseline to compare against.
- **Added end-to-end checks for how a post page loads.** They are in `e2e/post-page-loading.spec.js`.

### Rendering and data

- **Pre-rendered the archive and tag pages (#73).** Both now arrive as rendered HTML with no spinner. The archive's first page comes from `getStaticProps`. Tag pages are rendered on their first request and then cached. Both refresh on the same interval as the home and post pages.
- **Left post bodies out of the pre-rendered listings (#73).** Those pages only show intros, so dropping the bodies brought `/archive`'s page data from 131 kB to under Next's 128 kB large-page-data warning.
- **Moved Vercel functions next to the database (#70).** They ran in `iad1` (Virginia) while CockroachDB is in `aws-us-west-2`, so every page refresh and uncached API call crossed the country. They now run in `pdx1` (Portland). Cached pages are still served from the edge nearest each reader.

### Search

- **Shrank, cached and lazy-loaded the search index (#71).**
  - It used to be 564 KB gzipped, uncached, and fetched on every page view.
  - It now sends compact entries (entryId, title, datePosted, and each searchable word once) with stop words removed: 216 KB for 1000 posts, with the same search results.
  - It is cached on the CDN.
  - It is fetched only the first time search opens, and terms typed before it arrives are still searched.

### Fonts

- **Self-hosted the fonts (#74).** The render-blocking Google Fonts `@import`s are gone, and JetBrains Mono and Lato are now self-hosted. This also fixed a bug: JetBrains Mono had never actually loaded, so code text was showing in the system monospace font. The unused Dosis and IBM Plex Mono fonts were dropped.

### Images

- **Re-encoded the fallback background.** `public/img/gold-rush-desktop.jpg` went from 1 MB to 253 KB (1920px, quality 75, progressive).
- **Gave title images a fixed 3:2 box.** It uses `aspect-ratio` and `object-fit: cover`, so the page no longer shifts as images load (CLS).
- **Sent post images through Next's image optimizer (#75).** They are resized for each layout and converted to AVIF/WebP. Preview images went from about 150–400 KB to about 13–30 KB. The home hero is now a real image instead of a CSS background, so the browser finds it early.
- **Fetched the title image right away on single-post pages.** It used to be lazy-loaded, which delayed it by 1.3–1.6 s on mobile Lighthouse. It now uses `loading="eager"` and `fetchPriority="high"`. We used those instead of next/image's `preload` because that preload link is fetched at low priority until layout.
- **Turned the post background into a resized, low-priority image.** It had been the full-size hero (244 KB) as a CSS background, competing with the title image. It is now a screen-sized next/image, lazy and at `fetchPriority="low"`.
- **Replaced YouTube embeds with click-to-play thumbnails.** Each iframe loaded about 900 KB of player scripts before anyone pressed play (1.8 MB on `/archive/3420`). The thumbnail is drawn as an `<img>` so the browser finds it in the HTML. This change also fixed a resize listener that was being added on every render.

## Vercel and Next.js features used

### Vercel

- **Speed Insights** (`@vercel/speed-insights`) for real-user Core Web Vitals.
- **Function regions**: `"regions": ["pdx1"]` in `vercel.json`.
- **CDN caching for an API route**: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on the search route.
- **Vercel's image optimization and CDN cache**, which is what next/image uses when deployed there. Resized copies are kept for 31 days (`minimumCacheTTL`), which saves image transformations from the plan's quota.

### Next.js

- **Incremental Static Regeneration (ISR)**: `getStaticProps` with `revalidate`, and `getStaticPaths` with `fallback: 'blocking'`.
- **The large-page-data threshold** (128 kB), used as the target for slimming the listings.
- **`next/font/google`**: self-hosted fonts exposed as CSS variables on `:root`, so portaled modals get them too.
- **`next/image`**:
  - `images.remotePatterns` for the Bunny host, with `formats: ['image/avif', 'image/webp']` and `qualities: [75]`.
  - Per-layout `sizes`, plus `fill` for the hero and background.
  - `fetchPriority` and `loading` to control fetch order.
  - `unoptimized` for images from other hosts (YouTube thumbnails, Google map fallbacks).
  - `preload` for the home hero.
