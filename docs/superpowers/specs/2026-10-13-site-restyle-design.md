# Site Restyle: Search-UI Aesthetic Site-Wide, Inside the Theme System

## Intent

Apply the search modal's look (flat dark panels, single-pixel borders, monospace
chrome, square corners) to the whole site, with small cheerful pops of color
and no gradients. Build it inside the existing CSS theme system
(`styles/themes/`), so High Contrast Mode keeps working unchanged.

Success: the default theme reads as one coherent system with a clear
three-tier color hierarchy and no gradient text or gradient fills; High
Contrast Mode looks as it does today apart from the structural changes below;
blog post titles un-scramble once as they come on screen.

## Decisions (from brainstorming with Chris)

- **Typography:** monospace for chrome (titles, headings, nav, dates, labels,
  metadata), uppercase and letter-spaced. Long-form post body stays Lato.
  Merriweather is dropped. Typography applies in both themes.
- **Backdrop:** keep the photo backdrop. Panels become solid with a 1px border.
- **Corners:** square, via one variable (`--theme-radius`), in both themes.
  Intentional circles (`border-radius: 50%`) stay round. High Contrast's hero
  card keeps its own `--theme-hero-card-radius`.
- **Hero exception:** the latest-post hero keeps its gradient overlay
  (`--theme-hero-overlay`) and card text shadow (`--theme-hero-card-shadow`).
- **High-contrast toggle:** keeps its deliberate black/white look in both
  themes; only its corners square off.

## Theme variables

All color decisions live in `styles/themes/default.scss`; components read only
theme variables (the existing rule stated at the top of that file).

### New variables

| Variable | default.scss | high-contrast-dark.scss | Role |
|---|---|---|---|
| `--theme-title-color` | `#ffd84d` | `currentColor` | top-level titles (site banners, the homepage hero's post title, tag-page heading) |
| `--theme-heading-color` | `#5cc8ff` | `currentColor` | 2nd-level headings (post titles on the post page and preview cards, section titles, repo names, in-post h2) |
| `--theme-info-color` | `#33ff33` | `currentColor` | 3rd-tier info (dates, read time, tags, commit hashes, "continue"/"more", in-post h3) |
| `--theme-post-link-color` | `#c0c0c0` | `LinkText` | links inside post bodies |
| `--theme-radius` | `0` | (inherits) | all rectangular corners |
| `--theme-track-title-color` | `#fff` | `currentColor` | Listening track titles (keeps Chris's "titles white") |
| `--theme-track-artist-color` | `#ddd` | `currentColor` | Listening artists (keeps "artists light grey") |

### Changed default values

| Variable | From | To |
|---|---|---|
| `--theme-content-text` | `#222` | `#c0c0c0` |
| `--theme-panel-bg` | 105deg black gradient | `#1a1a1a` |
| `--theme-hairline` | `rgba(255,255,255,0.2)` | `#333` |
| `--theme-chip-bg` | `rgba(255,255,255,0.2)` | `#2a2a2a` |
| `--theme-color-text` | `#fff` | `#c0c0c0` |
| `--theme-text-muted` | `#ddd` | `#c0c0c0` |
| `--theme-text-subtle` | `#aaa` | `#707070` |
| `--theme-color-subtext` | `#555` | `#707070` |
| `--theme-color-border` | `#555` | `#333` |
| `--theme-color-content-text-bg` | `#fff` | `#1a1a1a` |
| `--theme-color-pop` | `lightskyblue` | `#5cc8ff` |
| `--theme-accent-hover` | `deepskyblue` | `#5cc8ff` |
| `--theme-highlight-text` | `yellow` | `#ffd84d` |
| `--theme-post-link-border` | `1px solid var(--theme-color-pop)` | `1px solid #33ff33` |
| `--theme-quiet-link-color` | `#fff` | `#c0c0c0` |
| `--theme-hover-bg` | `rgba(255,255,255,0.2)` | `#2a2a2a` |
| `--theme-hover-border` | `white` | `#333` |
| `--theme-button-bg` | `black` | `#1a1a1a` |
| `--theme-button-text` | `white` | `#5cc8ff` |
| `--theme-nav-button-bg` | `rgba(0,0,0,0.7)` | `#1a1a1a` |
| `--theme-nav-button-text` | `white` | `#5cc8ff` |
| `--theme-nav-button-border` | `none` | `1px solid #5cc8ff` |
| `--theme-nav-button-hover-bg` | yellow→orange gradient | `#2a2a2a` |
| `--theme-nav-button-hover-text` | `white` | `#5cc8ff` |
| `--theme-header-title-color` | `currentColor` | `#ffd84d` |
| `--theme-hero-card-meta-text` | `rgba(255,255,255,0.7)` | `#33ff33` |
| `--theme-modal-bg` | `white` | `#1a1a1a` |
| `--theme-modal-border` | `none` | `1px solid #333` |
| `--theme-modal-shadow` | `#111 9px 15px 20px` | `none` |
| `--theme-readme-bg` | `darkslategray` | `#1a1a1a` |
| `--theme-readme-text` | `#fffacd` | `#c0c0c0` |

`--theme-header-stuck-bg` already follows `--theme-panel-bg`, so it becomes
flat. Search variables keep their values (they already are the search look).

### Removed variables

`--theme-pop-gradient`, `--theme-section-title-gradient`, `--theme-pop-fill`
(both themes), once no component uses them. Also `--font-title` and
`--theme-border-radius-large` in `globals.scss`.

## Mixins (`styles/mixins.scss`)

- Remove `poptext`, `poptextYellow`, `poptextSectionHeader`, `unPop`,
  `gradientBackground`, `backgroundCrossFade`, `popSvgYellow`.
- Add `panel()`: `background: var(--theme-panel-bg); border: 1px solid
  var(--theme-color-border); border-radius: var(--theme-radius);`
- Add `monoChrome()`: `font-family: var(--font-monospace); font-weight: normal;
  text-transform: uppercase; letter-spacing: 0.05em;`

## Component mapping

- The site banner and the homepage hero's post title → `color:
  var(--theme-title-color)` (banner: `var(--theme-header-title-color)`), mono.
- Post titles on the post page and on preview cards ("Previously", archive
  list, next/previous) → `var(--theme-heading-color)`, mono (Chris's call:
  post title blue, its metadata green).
- Section titles (PageSection) and repo names → `var(--theme-heading-color)`.
- Dates, read time, tags, commit hashes, "continue"/"more", hero byline meta →
  `var(--theme-info-color)` (hero meta keeps `--theme-hero-card-meta-text`),
  mono.
- Panels (`backgroundCrossFade` users) → `panel()`.
- Fixed radii → `var(--theme-radius)`.
- In-body post links → `color: var(--theme-post-link-color)` with the existing
  `--theme-post-link-border`; in-post `h2` → heading color, `h3` → info color,
  both mono.
- Banners: monospace with `letter-spacing: 0`, sized so header + nav (search
  button and high-contrast toggle) fit at 375px; the trail-maps banner fits on
  one line at 375px.
- Content font `HelveticaNeue-condensed` → `var(--font-main)`.
- Tag page heading (`--font-title`) → mono title styling.
- Sections added since the original design (Listening / RecentTracks, tag
  pages, PostBackground) get the same treatment. Exception: Listening track
  titles stay white and artists light grey (an explicit earlier decision of
  Chris's, pinned by `e2e/listening.spec.js`); RecentTracks reads the two new
  track variables so the general text change to `#c0c0c0` doesn't alter them.

## Scramble-on-visible titles

Already implemented on this branch (cherry-picked): `ScrambleText`
`trigger="visible"` (IntersectionObserver, fires once; reduced motion and
missing IntersectionObserver show final text) and `PostTitle` (heading with
`aria-label` = real title) used at every post-title site. Unit tests exist.

## Testing

- Unit: existing ScrambleText/PostTitle suites; full Jest suite green.
- SCSS compile check on every touched stylesheet.
- E2E (Playwright, `e2e/restyle.spec.js`, desktop + mobile projects, real
  site and data, no mocks):
  - a post title below the fold shows its real text after scrolling into view
    and settles (text equals `aria-label`);
  - the high-contrast toggle is present and switches `data-theme` on `<html>`
    to `high-contrast-dark` and back;
  - at phone width, the search button and the high-contrast toggle are both
    fully inside the viewport, and the page has no horizontal scroll.
- Visual walkthrough of `/`, a post, `/archive`, a tag page, `/links`,
  `/trailmaps`, search, and a README modal, in both themes, at desktop and
  375px.
