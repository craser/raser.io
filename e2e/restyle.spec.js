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

test("in High Contrast Mode, GitHub repo and commit links use the browser's link colour", async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('high-contrast-toggle');
    await expect(toggle).toBeVisible({ timeout: 30000 });
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'high-contrast-dark');

    const github = page.locator('section', { has: page.getByRole('heading', { name: 'Recent Github Activity', exact: true }) });
    await expect(github).toBeVisible({ timeout: 30000 });
    // Commit messages use the quiet link colour (LinkText in High Contrast Mode): the reference.
    const commitMessage = github.locator('a[href*="/commit/"]').first();
    await expect(commitMessage).toBeVisible({ timeout: 30000 });
    // A repo name sits in an h2 beside the icon; a commit hash is a short hex string.
    const repoLink = github.locator('h2 a').first();
    const commitHash = github.locator('a[href*="/commit/"]').filter({ hasText: /^[0-9a-f]{8}$/ }).first();
    const color = (locator) => locator.evaluate((element) => getComputedStyle(element).color);
    const reference = await color(commitMessage);
    expect(await color(repoLink)).toBe(reference);
    expect(await color(commitHash)).toBe(reference);
});
