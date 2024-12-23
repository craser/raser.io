/**
 * Returns unformatted plain text from the given post.
 *
 * Uses the DOM to strip out HTML & return the text content of the given blog post.
 *
 * @param post
 * @returns {string}
 */
export function extractText(post) {
    const div = document.createElement('div');
    div.innerHTML = [
        post.intro,
        post.body,
    ].filter(t => t).join(' ');
    const stripped = div.textContent;
    const sanitized = stripped.replaceAll(/\s+/g, ' ');
    return sanitized;
}
