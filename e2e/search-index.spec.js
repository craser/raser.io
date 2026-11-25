// ABOUTME: End-to-end checks that the search index is fetched only when search is opened, arrives as
// ABOUTME: compact CDN-cacheable stubs, and still finds posts by words in their bodies.

const { test, expect } = require('@playwright/test');

function recordSearchRequests(page) {
    const urls = [];
    page.on('request', req => {
        if (req.url().includes('/api/entries/search/')) {
            urls.push(req.url());
        }
    });
    return urls;
}

test('a plain page view does not fetch the search index', async ({ page }) => {
    const searchRequests = recordSearchRequests(page);
    await page.goto('/');
    await expect(page.getByTestId('post-title').first()).toBeVisible({ timeout: 30000 });
    await page.waitForLoadState('networkidle');
    expect(searchRequests).toEqual([]);
});

test('opening search fetches the index once, and finds posts', async ({ page }) => {
    const searchRequests = recordSearchRequests(page);
    await page.goto('/');
    await expect(page.getByTestId('post-title').first()).toBeVisible({ timeout: 30000 });

    await page.getByTestId('search-button').first().click();
    const input = page.getByTestId('search-input');
    await input.pressSequentially('cornering');
    await expect(page.locator('[data-testclass="search-result"]').first()).toBeVisible({ timeout: 30000 });

    await page.keyboard.press('Escape');
    await page.getByTestId('search-button').first().click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    expect(searchRequests).toHaveLength(1);
});

test('the search index is compact and CDN-cacheable', async ({ request }) => {
    const response = await request.get('/api/entries/search/1000');
    expect(response.ok()).toBe(true);
    expect(response.headers()['cache-control']).toBe('public, s-maxage=3600, stale-while-revalidate=86400');
    const stubs = await response.json();
    expect(stubs.length).toBeGreaterThan(0);
    stubs.forEach(stub => expect(Object.keys(stub).sort()).toEqual(['datePosted', 'entryId', 'text', 'title']));
});
