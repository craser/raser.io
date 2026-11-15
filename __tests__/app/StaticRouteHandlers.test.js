/**
 * ABOUTME: Checks which App Router route handlers Next.js generates once at build time.
 * ABOUTME: Next.js 15+ runs GET handlers per request unless the route opts into static generation.
 *
 * @jest-environment node
 */

jest.mock('octokit', () => ({ Octokit: jest.fn() }));

describe.each([
    ['/rss', '@/app/rss/route'],
    ['/api/github/recent', '@/app/api/github/recent/route'],
    ['/api/social/recent', '@/app/api/social/recent/route'],
])('%s', (routePath, modulePath) => {
    it('is generated at build time rather than per request', () => {
        const route = require(modulePath);
        expect(route.dynamic).toBe('force-static');
    });
});
