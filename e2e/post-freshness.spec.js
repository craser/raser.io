// ABOUTME: End-to-end checks that a single-post page shows the post as the database has it: the text is in
// ABOUTME: the server-rendered HTML, and an old copy left in the browser's post cache cannot replace it.

const { test, expect } = require('@playwright/test');

const CACHE_KEY = 'rio-dao-cache';
const STALE_TEXT = 'STALE-CACHED-COPY';

async function newestPost(request) {
    const response = await request.get('/api/entries/latest/0?pageSize=1');
    expect(response.ok()).toBe(true);
    const [post] = await response.json();
    return post;
}

test('the post page arrives with the post already in its HTML', async ({ request }) => {
    const post = await newestPost(request);
    const response = await request.get(`/archive/${post.entryId}`);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    expect(nextData).not.toBeNull();
    const served = JSON.parse(nextData[1]).props.pageProps.post;
    expect(served.entryId).toBe(post.entryId);
    expect(served.lastUpdated).toBe(post.lastUpdated);
    expect(served.intro).toBe(post.intro);
});

test('an old copy of the post in the browser cache does not replace the server copy', async ({ page, request }) => {
    const post = await newestPost(request);
    await page.goto('/');
    await page.evaluate(({ key, entryId, staleText }) => {
        const stale = { entryId, title: staleText, intro: `<p>${staleText}</p>`, body: null, attachments: [], tags: [] };
        window.localStorage.setItem(key, JSON.stringify([
            { key: entryId, value: stale, meta: {}, created: Date.now() }
        ]));
    }, { key: CACHE_KEY, entryId: post.entryId, staleText: STALE_TEXT });

    await page.goto(`/archive/${post.entryId}`);
    await expect(page.getByTestId('post-title').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('body')).not.toContainText(STALE_TEXT);
});
