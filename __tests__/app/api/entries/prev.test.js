/**
 * @jest-environment node
 */
// ABOUTME: Tests for GET /api/entries/[id]/prev — navigate to the older post.
// ABOUTME: Verifies found, end-of-archive (null), and response format.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getPrevPost: jest.fn(id => {
                if (id === '5') return { entryId: '4', title: 'Older Post' };
                return null;
            }),
        }),
    },
}));

import { GET } from '@/app/api/entries/[id]/prev/route';

test('returns the prev (older) post', async () => {
    const res = await GET(new Request('http://x/api/entries/5/prev'), { params: { id: '5' } });
    expect(res.status).toBe(200);
    expect((await res.json()).entryId).toBe('4');
});

test('returns 404 when there is no prev post', async () => {
    const res = await GET(new Request('http://x/api/entries/1/prev'), { params: { id: '1' } });
    expect(res.status).toBe(404);
});
