// ABOUTME: Tests which image URLs are sent through Next's image optimizer.
// ABOUTME: Only the post-image CDN is allowed; everything else is served as-is.

import { isOptimizable, OPTIMIZED_IMAGE_HOST } from '@/lib/images/OptimizedImageHost';

test('the optimized host is the one post title images are served from', () => {
    expect(OPTIMIZED_IMAGE_HOST).toEqual('raserio.b-cdn.net');
});

test.each([
    ['https://raserio.b-cdn.net/photo.jpg', true],
    ['https://raserio.b-cdn.net/maps/ride.jpg', true],
    ['http://raserio.b-cdn.net/photo.jpg', false],
    ['https://i.ytimg.com/vi/abc/hqdefault.jpg', false],
    ['https://maps.googleapis.com/maps/api/staticmap?size=630x290', false],
    ['/img/gold-rush-desktop.jpg', false],
    ['proof/of/config/call/test.jpg', false],
    [undefined, false],
    [null, false],
])('isOptimizable(%p) is %p', (src, expected) => {
    expect(isOptimizable(src)).toBe(expected);
});
