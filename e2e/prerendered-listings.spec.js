// ABOUTME: End-to-end checks that the archive and tag listings arrive with their first page of posts in the
// ABOUTME: server-rendered HTML, and that scrolling carries on from the second page instead of reloading the first.

const { test, expect } = require('@playwright/test');

const PAGE_SIZE = 30;

function servedPageProps(html) {
    const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    expect(nextData).not.toBeNull();
    return JSON.parse(nextData[1]).props.pageProps;
}

async function newestPosts(request) {
    const response = await request.get(`/api/entries/latest/0?pageSize=${PAGE_SIZE}`);
    expect(response.ok()).toBe(true);
    return response.json();
}

async function newestTaggedPost(request) {
    const response = await request.get('/api/entries/search/1000');
    expect(response.ok()).toBe(true);
    const posts = await response.json();
    const post = posts.find(p => p.tags.length > 0);
    expect(post, 'expected at least one post to carry a tag').toBeDefined();
    return post;
}

/** Records the entries API requests the page makes, so a test can check which pages it asked for. */
function recordEntryRequests(page) {
    const urls = [];
    page.on('request', request => {
        if (request.url().includes('/api/entries/')) {
            urls.push(request.url());
        }
    });
    return urls;
}

test('the archive arrives with its first page of posts already in its HTML', async ({ request }) => {
    const posts = await newestPosts(request);
    const response = await request.get('/archive');
    expect(response.ok()).toBe(true);
    const served = servedPageProps(await response.text()).initialEntries;
    expect(served.map(p => p.entryId)).toEqual(posts.map(p => p.entryId));
});

test('a tag page arrives with the tag\'s first page of posts already in its HTML', async ({ request }) => {
    const post = await newestTaggedPost(request);
    const tag = post.tags[0];
    const response = await request.get(`/tags/${encodeURIComponent(tag)}`);
    expect(response.ok()).toBe(true);
    const props = servedPageProps(await response.text());
    expect(props.tag).toBe(tag);
    expect(props.initialEntries.map(p => p.entryId)).toContain(post.entryId);
});

test('scrolling the archive loads the second page, not the first again', async ({ page }) => {
    const entryRequests = recordEntryRequests(page);
    await page.goto('/archive');
    await expect(page.getByTestId('post-title').first()).toBeVisible({ timeout: 30000 });

    const secondPage = page.waitForRequest(/\/api\/entries\/latest\/1\b/, { timeout: 30000 });
    await page.mouse.wheel(0, 1000000);
    await secondPage;
    expect(entryRequests.filter(url => /\/api\/entries\/latest\/0\b/.test(url))).toEqual([]);
});
