/**
 * @jest-environment node
 */
// ABOUTME: Tests for the RSS feed route.
// ABOUTME: Verifies that the feed uses BlogData and produces valid RSS XML.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getEntries: jest.fn(() => [
                {
                    entryId: '1',
                    title: 'Test Post',
                    intro: 'Test intro',
                    datePosted: '2023-01-01T00:00:00',
                },
            ]),
        }),
    },
}));

jest.mock('@/lib/util/Links', () => ({
    getPostLink: jest.fn(() => 'https://raser.io/archive/1'),
}));

import { GET } from '@/app/rss/route';

test('returns RSS XML with Content-Type header', async () => {
    const res = await GET(new Request('http://x/rss'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/rss+xml');
});

test('RSS body contains post title and link', async () => {
    const res = await GET(new Request('http://x/rss'));
    const text = await res.text();
    expect(text).toContain('<title><![CDATA[Test Post]]></title>');
    expect(text).toContain('https://raser.io/archive/1');
});
