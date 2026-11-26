// ABOUTME: Says whether an image URL is on the CDN that Next's image optimizer is allowed to resize.
// ABOUTME: next.config.js allows the same host, so the two can't drift apart.

const config = require('../../siteconfig.json');

/** Post title images live on this host; next.config.js lists it in images.remotePatterns. */
export const OPTIMIZED_IMAGE_HOST = new URL(config.images.postcard).hostname;

/**
 * True when src can go through /_next/image. Anything else (YouTube thumbnails, Google map
 * fallbacks, local files) would be refused by the optimizer, so it's served as-is.
 */
export function isOptimizable(src) {
    if (typeof src !== 'string') {
        return false;
    }
    try {
        const url = new URL(src);
        return url.protocol === 'https:' && url.hostname === OPTIMIZED_IMAGE_HOST;
    }
    catch {
        return false; // relative paths and other non-URLs
    }
}
