// ABOUTME: Builds links to site resources.
// ABOUTME: The link builders are relative, for in-app navigation; getAbsoluteUrl makes one absolute.

import SiteConfig from '@/lib/SiteConfig';

export function getPostLink(post) {
    return `/archive/${post.entryId}`
}

export function getDownloadLink(fileName) {
    return `/d/${fileName}`;
}

/**
 * Resolves a site-relative path against the site's canonical URL. Feeds, metadata and
 * anything else read off the site needs an absolute URL; in-app navigation does not.
 */
export function getAbsoluteUrl(path) {
    return new URL(path, new SiteConfig().getValue('site.url')).toString();
}
