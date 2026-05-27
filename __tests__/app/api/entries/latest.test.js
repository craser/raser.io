/**
 * @jest-environment node
 */
// ABOUTME: Tests for GET /api/entries/latest/[page] — paginated blog entries.
// ABOUTME: Verifies page index, pageSize param, and JSON response shape.

jest.mock('@/lib/data/BlogData', () => {
    const MOCK = Array.from({ length: 25 }, (_, i) => ({
        entryId: String(i + 1),
        title: `Post ${i + 1}`,
    }));
    return {
        __esModule: true,
        default: { getInstance: () => ({ getEntries: (page, size) => MOCK.slice(page * size, (page + 1) * size) }) },
    };
});

import { GET } from '@/app/api/entries/latest/[page]/route';

test('returns entries for page 0', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/0?pageSize=10'), { params: { page: '0' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(10);
    expect(data[0].entryId).toBe('1');
});

test('returns entries for page 1', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/1?pageSize=10'), { params: { page: '1' } });
    const data = await res.json();
    expect(data).toHaveLength(10);
    expect(data[0].entryId).toBe('11');
});

test('returns empty array past last page', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/99?pageSize=10'), { params: { page: '99' } });
    expect(await res.json()).toHaveLength(0);
});

test('defaults pageSize to 10', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/0'), { params: { page: '0' } });
    expect(await res.json()).toHaveLength(10);
});

test('defaults to page 0 when page is not a number', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/invalid?pageSize=10'), { params: { page: 'invalid' } });
    const data = await res.json();
    expect(data).toHaveLength(10);
    expect(data[0].entryId).toBe('1');
});
