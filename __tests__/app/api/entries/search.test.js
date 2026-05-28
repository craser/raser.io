/**
 * @jest-environment node
 */
// ABOUTME: Tests for GET /api/entries/search/[numEntries] — bulk stubs for client-side search.
// ABOUTME: Verifies count limiting and response format.

jest.mock('@/lib/data/BlogData', () => {
    const STUBS = Array.from({ length: 50 }, (_, i) => ({ entryId: String(i + 1), title: `Post ${i + 1}` }));
    return {
        __esModule: true,
        default: { getInstance: () => ({ getSearchStubs: n => STUBS.slice(0, n) }) },
    };
});

import { GET } from '@/app/api/entries/search/[numEntries]/route';

test('returns the requested number of entries', async () => {
    const res = await GET(
        new Request('http://x/api/entries/search/10'),
        { params: { numEntries: '10' } }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(10);
});

test('returns all available when numEntries exceeds total', async () => {
    const res = await GET(
        new Request('http://x/api/entries/search/1000'),
        { params: { numEntries: '1000' } }
    );
    expect(await res.json()).toHaveLength(50);
});

test('defaults to 1000 entries when numEntries is not a number', async () => {
    const res = await GET(
        new Request('http://x/api/entries/search/invalid'),
        { params: { numEntries: 'invalid' } }
    );
    expect(res.status).toBe(200);
    // Mock has 50 entries; 1000 default means all 50 are returned
    expect(await res.json()).toHaveLength(50);
});
