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
