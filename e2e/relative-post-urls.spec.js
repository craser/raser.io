// ABOUTME: End-to-end check that relative links stored in post HTML (href="archive/2692") render root-relative,
// ABOUTME: so on /archive/<id> they point at /archive/2692 rather than /archive/archive/2692.

const { test, expect } = require('@playwright/test');

const RELATIVE_ARCHIVE_LINK = /href=["']archive\/(\d+)["']/;

async function postWithRelativeLink(request) {
    const response = await request.get('/api/entries/latest/0?pageSize=1000');
    expect(response.ok()).toBe(true);
    const posts = await response.json();
    const post = posts.find(p => RELATIVE_ARCHIVE_LINK.test(p.intro ?? ''));
    expect(post, 'expected at least one post whose intro has a relative archive/ link').toBeDefined();
    return { post, linkedId: post.intro.match(RELATIVE_ARCHIVE_LINK)[1] };
}

test('a relative archive link in a post points at the linked post from the post page', async ({ page, request }) => {
    const { post, linkedId } = await postWithRelativeLink(request);
    await page.goto(`/archive/${post.entryId}`);
    await expect(page.getByTestId('post-title').first()).toBeVisible({ timeout: 30000 });

    await expect(page.locator(`a[href="/archive/${linkedId}"]`).first()).toBeAttached();
    await expect(page.locator('a[href^="archive/"]')).toHaveCount(0);
});
