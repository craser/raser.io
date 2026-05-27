/**
 * @jest-environment node
 */
// ABOUTME: Tests for GET /api/entries/[id]/next — navigate to the newer post.
// ABOUTME: Verifies found, end-of-archive (null), and response format.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getNextPost: jest.fn(id => {
                if (id === '5') return { entryId: '6', title: 'Newer Post' };
                return null;
            }),
        }),
    },
}));

import { GET } from '@/app/api/entries/[id]/next/route';

test('returns the next (newer) post', async () => {
    const res = await GET(new Request('http://x/api/entries/5/next'), { params: { id: '5' } });
    expect(res.status).toBe(200);
    expect((await res.json()).entryId).toBe('6');
});

test('returns 404 when there is no next post', async () => {
    const res = await GET(new Request('http://x/api/entries/99/next'), { params: { id: '99' } });
    expect(res.status).toBe(404);
});
