// ABOUTME: End-to-end checks of how a single-post page loads: the title image is fetched first, the background
// ABOUTME: is a resized low-priority image, and a YouTube video loads its player only when clicked.

const { test, expect } = require('@playwright/test');

const YOUTUBE_EMBED = /<iframe[^>]*src=["']https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//i;
const OPTIMIZER_URL = /^\/_next\/image\?url=https%3A%2F%2F/;

async function latestPosts(request) {
    const response = await request.get('/api/entries/latest/0?pageSize=1000');
    expect(response.ok()).toBe(true);
    return response.json();
}

async function postWithPhoto(request) {
    const post = (await latestPosts(request))
        .find(p => p.imageFileType === 'image' && p.imageFileName && !/\.gpx$/i.test(p.imageFileName));
    expect(post, 'expected at least one post with a photo title image').toBeDefined();
    return post;
}

async function postWithYouTubeVideo(request) {
    const post = (await latestPosts(request)).find(p => YOUTUBE_EMBED.test(`${p.intro ?? ''}${p.body ?? ''}`));
    expect(post, 'expected at least one post with an embedded YouTube video').toBeDefined();
    return post;
}

test('the title image is fetched straight away, at high priority', async ({ page, request }) => {
    const post = await postWithPhoto(request);
    await page.goto(`/archive/${post.entryId}`);
    const titleImage = page.locator('img.titleimage').first();
    await expect(titleImage).toBeVisible({ timeout: 30000 });

    await expect(titleImage).toHaveAttribute('loading', 'eager');
    await expect(titleImage).toHaveAttribute('fetchpriority', 'high');
});

test('the background is a resized image, fetched at low priority', async ({ page, request }) => {
    const post = await postWithPhoto(request);
    await page.goto(`/archive/${post.entryId}`);
    const background = page.getByTestId('post-background').locator('img');
    await expect(background).toBeAttached({ timeout: 30000 });

    await expect(background).toHaveAttribute('src', OPTIMIZER_URL);
    await expect(background).toHaveAttribute('fetchpriority', 'low');
});

test('a YouTube video loads its player only when its thumbnail is clicked', async ({ page, request }) => {
    const post = await postWithYouTubeVideo(request);
    const youtubeRequests = [];
    page.on('request', r => {
        if (/youtube(-nocookie)?\.com\/(embed|s\/player)/.test(r.url())) {
            youtubeRequests.push(r.url());
        }
    });
    await page.goto(`/archive/${post.entryId}`);
    const facade = page.getByTestId('youtube-facade').first();
    await expect(facade).toBeVisible({ timeout: 30000 });
    await page.waitForLoadState('networkidle');
    expect(youtubeRequests).toEqual([]);

    await facade.click();
    const player = page.getByTestId('youtube-embed').first();
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute('src', /autoplay=1/);
});
