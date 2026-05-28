/**
 * @jest-environment node
 */
// ABOUTME: Tests for GET /api/entries/[id] — fetch a single blog entry.
// ABOUTME: Verifies found, not-found, and response format.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getPostById: jest.fn(id =>
                id === '42'
                    ? { entryId: '42', title: 'Found Post' }
                    : null
            ),
        }),
    },
}));

import { GET } from '@/app/api/entries/[id]/route';

test('returns post when found', async () => {
    const res = await GET(new Request('http://x/api/entries/42'), { params: { id: '42' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entryId).toBe('42');
    expect(data.title).toBe('Found Post');
});

test('returns 404 when not found', async () => {
    const res = await GET(new Request('http://x/api/entries/999'), { params: { id: '999' } });
    expect(res.status).toBe(404);
});
