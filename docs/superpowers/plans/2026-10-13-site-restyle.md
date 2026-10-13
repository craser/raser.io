# Site Restyle (Theme System) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the site in the search modal's flat, monospace-chrome aesthetic with a yellow/blue/green hierarchy, entirely through the CSS theme system, so High Contrast Mode keeps working.

**Architecture:** Colors change only in `styles/themes/default.scss` (plus new variables mirrored in `high-contrast-dark.scss`). Two new SCSS mixins (`panel`, `monoChrome`) replace the gradient mixins. Each component stylesheet is swept onto theme variables. Scramble-on-visible titles are already on the branch.

**Tech Stack:** Next.js 13 (Pages Router), React 18, SCSS modules, Jest 29 + Testing Library, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-13-site-restyle-design.md`

## Global Constraints

- Project rules: `/Users/craser/dev/cjr/wk/raser.io/CLAUDE.md` (main checkout; gitignored, not in this worktree). Key: two `// ABOUTME: ` lines atop new code files; 4-space indent; TDD for behavior; tests use `getByTestId` (Jest) — Playwright tests may use roles/test ids, never visible text for element lookup where a test id exists; never remove still-true comments, update stale ones; no unrelated whitespace changes; pristine test output; e2e tests use real data, no mocks.
- Components read ONLY theme variables for colors, backgrounds, borders' colors, shadows and overlays (rule at top of `styles/themes/default.scss`). Never hard-code a color in a component stylesheet.
- Every value in the spec's "New variables" and "Changed default values" tables is binding, verbatim.
- High Contrast Mode must look as it does today except: monospace chrome typography, square corners (`--theme-radius`), and its hero card keeps `--theme-hero-card-radius: 5px`.
- No gradients in components/pages/styles except `--theme-hero-overlay` (hero exception). No hard-coded shadows; `--theme-hero-card-shadow` stays; HighContrastToggle's inset box-shadow (its outline mechanism) stays.
- Rectangular radii → `var(--theme-radius)`; `50%` circles stay.
- Monospace (`var(--font-monospace)`) via `@include monoChrome()` for chrome; post body text stays `var(--font-main)`.
- Listening (RecentTracks) track titles stay `#fff`, artists `#ddd` in the default theme (pinned by `e2e/listening.spec.js`).
- Banners: header + nav (search button and high-contrast toggle) fit inside 375px; trail-maps banner fits one line at 375px.

## Review Focus

1. **High Contrast Mode regressions** — any component that hard-codes a color, or uses a new variable missing from `high-contrast-dark.scss`, breaks HC. → Task 1 adds every new variable to both theme files; each sweep task's reviewer checks no hard-coded colors; Task 7 e2e toggles the theme; Task 8 walks every page in HC.
2. **Phone-width header** — monospace banner pushing search/toggle off-screen. → Task 2 sizes; Task 7 e2e asserts both buttons are inside the viewport on the mobile project.
3. **Listening colors** — the general `#c0c0c0` text change must not alter track title/artist colors. → Task 3 uses track variables; `e2e/listening.spec.js` stays green (Task 7).
4. **Title that's already on screen** must still settle to the real title. → existing unit tests; Task 7 e2e checks a title settles.
5. **Post-title link underline** — `PostTitle` now sits inside the link on the post page; the in-body link underline must not appear under the title. → Task 4 `.entry a:has(> .title)` rule; Task 8 visual.

## SCSS compile check

```bash
node -e "const sass=require('sass'),path=require('path'),{pathToFileURL}=require('url');for(const f of process.argv.slice(1)){sass.compile(f,{importers:[{findFileUrl:u=>u.startsWith('@/')?pathToFileURL(path.resolve(u.slice(2))):null}]});console.log('ok',f)}" <files...>
```
Expected: one `ok <file>` per file. (Note: `styles/globals.scss` imports `themes/default` relative to itself — compile it with `--load-path`-free relative resolution; the command above handles it because sass resolves relative imports from the file's directory.)

---

### Task 1: Theme variables and mixins

**Files:** Modify `styles/themes/default.scss`, `styles/themes/high-contrast-dark.scss`, `styles/mixins.scss`.

**Interfaces — Produces:** CSS variables `--theme-title-color`, `--theme-heading-color`, `--theme-info-color`, `--theme-post-link-color`, `--theme-radius`, `--theme-track-title-color`, `--theme-track-artist-color` (both themes, values from the spec table; `--theme-radius` only in default.scss); SCSS mixins `panel()` and `monoChrome()`. Legacy mixins and `--theme-pop-*` / `--theme-section-title-gradient` variables STAY in this task (removed in Task 6).

- [ ] **Step 1:** In `default.scss`, add the new variables in a new block after `/* Text */`'s group, commented:
  ```scss
      /* The heading hierarchy: titles, then headings, then small supporting info */
      --theme-title-color: #ffd84d;
      --theme-heading-color: #5cc8ff;
      --theme-info-color: #33ff33;
      --theme-post-link-color: #c0c0c0; // links inside post bodies; their underline is --theme-post-link-border
      --theme-radius: 0; // every rectangular corner
      --theme-track-title-color: #fff; // the Listening section's track titles
      --theme-track-artist-color: #ddd; // ...and their artists
  ```
- [ ] **Step 2:** In `default.scss`, change every value listed in the spec's "Changed default values" table, exactly. Leave every other variable as is (search variables included). Keep existing comments; where a comment describes the old value (e.g. "dark, see-through slabs" for panels), update it to describe the new one ("flat dark slabs").
- [ ] **Step 3:** In `high-contrast-dark.scss`, add (in a matching block):
  ```scss
      /* The heading hierarchy: all inherit, like the rest of this theme's text */
      --theme-title-color: currentColor;
      --theme-heading-color: currentColor;
      --theme-info-color: currentColor;
      --theme-post-link-color: LinkText;
      --theme-track-title-color: currentColor;
      --theme-track-artist-color: currentColor;
  ```
  Also add `--theme-header-title-color` is already `#000` there — leave it. Do not change any existing HC value.
- [ ] **Step 4:** Append to `styles/mixins.scss`:
  ```scss
  // A flat panel: solid background, single-pixel border, themed corners.
  @mixin panel() {
      background: var(--theme-panel-bg);
      border: 1px solid var(--theme-color-border);
      border-radius: var(--theme-radius);
  }

  // Terminal-style chrome text for titles, labels and metadata.
  @mixin monoChrome() {
      font-family: var(--font-monospace);
      font-weight: normal;
      text-transform: uppercase;
      letter-spacing: 0.05em;
  }
  ```
- [ ] **Step 5:** Compile check `styles/globals.scss styles/mixins.scss` → `ok` ×2; `npm test` green.
- [ ] **Step 6:** Commit: `SITE-RESTYLE: palette and heading-tier theme variables, panel/monoChrome mixins`.

---

### Task 2: Header, nav, banners, modal, small UI

**Files:** `components/templates/FrontLandingLayout.module.scss`, `components/templates/StandardLayout.module.scss`, `components/templates/MapPageLayout.module.scss`, `components/navigation/NavButton.module.scss`, `components/theme/HighContrastToggle.module.scss`, `components/ui/ShowMore.module.scss`, `components/Modal.module.scss`.

**Consumes:** Task 1 variables and mixins.

- [ ] **FrontLandingLayout:** `.titleBanner`: `font-family: var(--font-title), serif` → `var(--font-monospace)`; delete `@include poptextYellow();` (color already comes from `--theme-header-title-color`); all `letter-spacing` → `0`; small-screen `font-size: 24px` (keep line-height), large-screen 60px block unchanged except letter-spacing. Reword the "odd kerning on final f" padding comment to "keep space between the title and the nav". `.sitenav a` `border-radius: 5px` → `var(--theme-radius)`. `.content` `font-family: HelveticaNeue-condensed, sans-serif` → `var(--font-main), sans-serif`.
- [ ] **StandardLayout:** same font/letter-spacing/radius/content-font changes for its `.titleBanner`, `.sitenav a`, `.content`.
- [ ] **MapPageLayout:** add `@import '@/styles/mixins.scss';`; `.titleBanner` `font: bold 80px var(--font-title), sans-serif` → `font: normal 40px var(--font-monospace)`; line-height (both duplicate declarations) → `60px`; letter-spacing (both) → `0`; append `@include large() { font-size: 80px; line-height: 120px; }` inside `.titleBanner`. Any hard-coded colors in this file (`black`, `#000`, `#e88c49`, `#222`) → title: `var(--theme-header-title-color)`; nav links: `var(--theme-nav-button-text)`, hover `var(--theme-info-color)`; content text `var(--theme-content-text)`. Content font → `var(--font-main), sans-serif`.
- [ ] **NavButton:** `border-radius: 5px` → `var(--theme-radius)`; delete `@include poptextYellow();` and in `:hover` replace `@include unPop(var(--theme-nav-button-hover-text));` with `color: var(--theme-nav-button-hover-text);` — keep the hover background line as is (it reads `--theme-nav-button-hover-bg`). Add `font-family: var(--font-monospace);`.
- [ ] **HighContrastToggle:** `border-radius: 5px` → `var(--theme-radius)` only.
- [ ] **ShowMore:** `border-radius: 5px` → `var(--theme-radius)`; color → `var(--theme-info-color)`, hover color stays `var(--theme-info-color)` with `background-color: var(--theme-hover-bg)`; add `font-family: var(--font-monospace);` (if it currently uses `--theme-color-pop`/`--theme-accent-hover`, replace those).
- [ ] **Modal:** `border-radius: 11px` → `var(--theme-radius)` (border and shadow already read theme variables).
- [ ] Compile check all seven files; `npm test` green. Commit: `SITE-RESTYLE: flat header, nav and banners; banners fit at phone width`.

---

### Task 3: Front page sections

**Files:** `components/frontpage/PageSection.module.scss`, `components/frontpage/LatestPost.module.scss`, `components/frontpage/LatestPost.jsx`, `components/frontpage/PreviousPosts.module.scss`, `components/github/GithubActivity.module.scss`, `components/spotify/RecentTracks.module.scss`.

- [ ] **PageSection:** `@include backgroundCrossFade();` → `@include panel();`. `.sectionTitleContainer` `font-weight: 600` → `normal`, add `font-family: var(--font-monospace); letter-spacing: 0.05em;`. `.sectionTitle`: color → `var(--theme-heading-color)`; delete `@include poptextSectionHeader;`. Remove any custom properties in `.pageSection` with no remaining `var()` user anywhere (grep first).
- [ ] **LatestPost.module.scss:** keep `--theme-hero-overlay`, `--theme-hero-card-*` usage as is. Add rules:
  ```scss
          .postTitle {
              @include monoChrome();
              color: var(--theme-title-color);
              font-size: 1.6em;
              line-height: 1.3em;
              margin: 0 0 0.5em 0;

              &:hover {
                  text-decoration: underline;
              }
          }

          .brief {
              font-size: 0.95em;
              margin-bottom: 1.5em;
          }

          .byLineName {
              @include monoChrome();
              font-size: 0.85em;
          }

          .byLineMeta {
              @include monoChrome();
              color: var(--theme-hero-card-meta-text);
              font-size: 0.75em;
          }
  ```
  inside `.postInfo` (ensure the file imports mixins). If an existing rule already styles byline meta with `--theme-hero-card-meta-text`, fold into it rather than duplicating.
- [ ] **LatestPost.jsx:** replace Tailwind classes: `PostTitle` `className={styles.postTitle}`; `PostBriefIntro` `className={styles.brief}`; `<p className="text-sm font-medium">` → `className={styles.byLineName}`; the meta `<p>`'s Tailwind classes → `className={styles.byLineMeta}`. Delete the `// TODO: get rid of this tailwind styling garbage` comment (resolved). Keep any non-Tailwind classes/props.
- [ ] **PreviousPosts:** radii → `var(--theme-radius)`; `.title`: replace `font-weight: 600; @include poptextYellow;` (and any stray `background-color`) with `@include monoChrome(); color: var(--theme-title-color); font-size: 1.1em; line-height: 1.3em;`; `.date` → `color: var(--theme-info-color)` + `monoChrome`; `.link` → `color: var(--theme-info-color)` + `monoChrome`; `.archiveLink` `@include poptextYellow;` → `@include monoChrome(); color: var(--theme-info-color);` and its svg color → `var(--theme-info-color)`.
- [ ] **GithubActivity:** `.header` `font-weight: 600` → `normal`, color → `var(--theme-heading-color)`, add `font-family: var(--font-monospace)`; `.repoLink` `@include poptextYellow;` → `@include monoChrome(); color: var(--theme-heading-color);`; radii → `var(--theme-radius)`; commit date (`--theme-text-muted` at ~line 119) → `var(--theme-info-color)` + `monoChrome`; commit hash: color → `var(--theme-info-color)`, add `border: 1px solid var(--theme-color-border)`. Leave commit message on `--theme-quiet-link-color`. Remove custom properties left with no users.
- [ ] **RecentTracks:** radii → `var(--theme-radius)` (album thumbnail too — it's rectangular); title color `var(--theme-color-text)` → `var(--theme-track-title-color)`; artist color `var(--theme-text-muted)` → `var(--theme-track-artist-color)`; `font-weight: bold` → leave (track title emphasis is content, not chrome).
- [ ] Compile check; `npm test` green. Commit: `SITE-RESTYLE: flat front-page sections with yellow/blue/green hierarchy`.

---

### Task 4: Posts, previews, tag page

**Files:** `components/Post.module.scss`, `components/PostPreview.module.scss`, `components/DatePosted.module.scss`, `pages/tags/TagPage.module.scss`.

- [ ] **Post.module.scss:**
  - `.entry`: replace `border-radius: 0`, `@include backgroundCrossFade();` and the `@include large() { border-radius: var(--theme-border-radius-large) }` block with `@include panel();`; add `font-family: var(--font-main), sans-serif;`. Keep its existing background/text variable lines unless `panel()` duplicates them (remove the duplicate `background-color` line if `panel()` sets background).
  - `.entry .title`: replace `font-family: var(--font-title); font-weight: 400; @include poptextYellow();` with `@include monoChrome(); color: var(--theme-title-color);` and `line-height: 1.3em;`; keep size, border-bottom, margin, alignment.
  - Replace the `.entry .title a { ... }` rule (PostTitle now sits inside the link) with `.entry a:has(> .title) { border: none; }` — keep its comment if any, updated.
  - `.entry a`: add `color: var(--theme-post-link-color);` (border keeps `--theme-post-link-border`).
  - `.entrymetainfo, .entryfooter`: color `var(--theme-color-subtext)` → `var(--theme-info-color)`; `font-family: sans-serif` → `var(--font-monospace)`; add `text-transform: uppercase; letter-spacing: 0.05em;`. `.entrymetainfo a` color → `var(--theme-info-color)`. Remove `font-variant-caps: small-caps` from `.tagslist`.
  - In the existing `.entry h2` block add `@include monoChrome(); color: var(--theme-heading-color);`; add `.entry h3 { @include monoChrome(); color: var(--theme-info-color); }`.
  - `.entryfooter` color `var(--theme-highlight-text)` → `var(--theme-info-color)`.
  - `.entryfooter button`: `border-radius: 10px` → `var(--theme-radius)`; `font-weight: bold` → `font-family: var(--font-monospace)`; add `border: 1px solid var(--theme-button-text)`.
  - `.nextPrevPreviewContainer`: collapse all `--theme-border-radius-large` radii (and the then-empty `@include small {}`) to `border-radius: var(--theme-radius);`.
- [ ] **PostPreview:** radii → `var(--theme-radius)`; `.title`: `font-weight: 600; @include poptextYellow;` → `@include monoChrome(); color: var(--theme-title-color);`; `.date` color → `var(--theme-info-color)` + `monoChrome`; `.link` color → `var(--theme-info-color)`.
- [ ] **DatePosted:** color → `var(--theme-info-color)`.
- [ ] **TagPage:** `.heading`: `font-family: var(--font-title); font-weight: 400; color: var(--theme-color-text)` → `@include monoChrome(); color: var(--theme-title-color);`; `.tag` color → `var(--theme-info-color)`.
- [ ] Compile check; `npm test` green. Commit: `SITE-RESTYLE: flat post pages, previews and tag page`.

---

### Task 5: Links page, trail-head cards, README modal

**Files:** `pages/links/LinkTree.module.scss`, `components/maps/TrailHeadCard.module.scss`, `components/github/RepoReadme.module.scss`.

- [ ] **LinkTree:** `.roundrect` radius → `var(--theme-radius)`; hard-coded `background-color: white` → `var(--theme-panel-bg)`; add `border: 1px solid var(--theme-color-border)`; delete hard-coded `box-shadow`; `.logo` radius → `var(--theme-radius)`; `.linkTitle` `color: black` → `@include monoChrome(); color: var(--theme-heading-color);` (import mixins). Keep `50%` favicon circle.
- [ ] **TrailHeadCard:** `background-color: white` → `var(--theme-panel-bg)`; `border: 1px solid black` → `1px solid var(--theme-color-border)`; radius → `var(--theme-radius)`; add `color: var(--theme-content-text)`.
- [ ] **RepoReadme:** headings: keep `border-bottom` with the readme text variable, and color `h1` `var(--theme-title-color)`, `h2` `var(--theme-heading-color)`, `h3` `var(--theme-info-color)` (background/text already theme variables).
- [ ] Compile check; `npm test` green. Commit: `SITE-RESTYLE: flat links page, trail-head cards and README headings`.

---

### Task 6: Remove legacy mixins, variables and fonts

**Files:** `styles/mixins.scss`, `styles/globals.scss`, `styles/themes/default.scss`, `styles/themes/high-contrast-dark.scss`, `tailwind.config.js`.

- [ ] **Step 1:** Grep `components pages styles app` for `poptext|unPop|gradientBackground|backgroundCrossFade|popSvgYellow|--theme-pop-|--theme-section-title-gradient|--font-title|--theme-border-radius-large|Merriweather|gradient\(|text-shadow|box-shadow`. Expected hits only: definitions in mixins/globals/theme files; `--theme-hero-overlay` and `--theme-hero-card-shadow` (values + LatestPost usage); `--theme-modal-shadow` (Modal usage + theme values); HighContrastToggle's inset box-shadow. Anything else → report, don't fix.
- [ ] **Step 2:** Delete the seven legacy mixins (keep `small`, `large`, `panel`, `monoChrome`); delete `--theme-pop-gradient`, `--theme-section-title-gradient`, `--theme-pop-fill` and their comment block from BOTH theme files; delete `--font-title` and `--theme-border-radius-large` from `globals.scss` and change the font import to `family=Lato` with comment `/* blog entries */`; remove the `backgroundImage` gradient block from `tailwind.config.js` (leave `extend: {}`).
- [ ] **Step 3:** Re-grep → only the allowed hits. Compile check every `styles/**/*.scss`, `components/**/*.scss`, `pages/**/*.scss`. `npm test` green. `npm run build` succeeds (report any failure verbatim).
- [ ] **Step 4:** Commit: `SITE-RESTYLE: remove gradient mixins, pop-gradient theme variables and Merriweather`.

---

### Task 7: End-to-end tests

**Files:** Create `e2e/restyle.spec.js`. Test IDs available: `post-title` (PostTitle headings), `high-contrast-toggle`, `search-button`, `site-nav`.

- [ ] **Step 1:** Write `e2e/restyle.spec.js` (ABOUTME header; same style as `e2e/listening.spec.js`; real site/data, no mocks):
  ```js
  // ABOUTME: End-to-end checks for the site restyle against the real site: titles un-scramble, the theme toggle works,
  // ABOUTME: and the header's buttons fit on a phone.

  const { test, expect } = require('@playwright/test');

  test('a post title below the fold settles on its real text after scrolling into view', async ({ page }) => {
      await page.goto('/');
      const titles = page.getByTestId('post-title');
      await expect(titles.last()).toBeAttached({ timeout: 30000 });
      const title = titles.last();
      await title.scrollIntoViewIfNeeded();
      const label = await title.getAttribute('aria-label');
      expect(label).toBeTruthy();
      await expect(title).toHaveText(label, { timeout: 5000 });
  });

  test('the high-contrast toggle switches the theme and back', async ({ page }) => {
      await page.goto('/');
      const toggle = page.getByTestId('high-contrast-toggle');
      await expect(toggle).toBeVisible({ timeout: 30000 });
      const html = page.locator('html');
      await toggle.click();
      await expect(html).toHaveAttribute('data-theme', 'high-contrast-dark');
      await toggle.click();
      await expect(html).not.toHaveAttribute('data-theme', 'high-contrast-dark');
  });

  test('the header buttons fit inside the viewport and the page does not scroll sideways', async ({ page }) => {
      await page.goto('/');
      const viewportWidth = page.viewportSize().width;
      for (const id of ['search-button', 'high-contrast-toggle']) {
          const button = page.getByTestId(id);
          await expect(button).toBeVisible({ timeout: 30000 });
          const box = await button.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
      }
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
  ```
  Before relying on them, confirm in source that `NavButton` forwards `data-testid` to the rendered `<button>` and what attribute value the DEFAULT theme leaves on `<html>` (adjust the "and back" assertion to the real default, e.g. `data-theme="default"` or absent). If `search-button` isn't forwarded, report NEEDS_CONTEXT rather than editing NavButton.
- [ ] **Step 2:** Run `npx playwright test` (both projects; uses the running dev server on :3000 if present). If browsers are missing, run `npx playwright install chromium` first. Expected: restyle + listening specs all pass. Report failures verbatim; do not weaken assertions.
- [ ] **Step 3:** Commit: `SITE-RESTYLE: e2e checks for title scramble, theme toggle and phone header`.

---

### Task 8: Visual walkthrough (controller)

- [ ] Both themes × (1280px, 375px): `/`, a post, `/archive`, a tag page, `/links`, `/trailmaps`, search modal, a README modal. Check: default theme has no gradients except hero overlay; square corners; 1px borders; yellow titles, blue headings/nav, green info; Lato body; HC looks as before except mono chrome + square corners; header buttons fit at 375px; no sideways scroll.
- [ ] Screenshots to Chris.
