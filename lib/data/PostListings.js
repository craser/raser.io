// ABOUTME: Trims posts down to what a post listing (the archive, a tag page) renders.
// ABOUTME: Listings show each post's intro, never its body, so the body is left out of their page data.

/**
 * Returns a copy of the post with its body left out (null).
 */
export function toListedPost(post) {
    return { ...post, body: null };
}
