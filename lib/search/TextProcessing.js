export function extractTextFromHtml(html) {
    if (!html) return '';
    const text = html
        .replace(/<[^>]*>/g, ' ') // Strip HTML tags
        .replace(/&nbsp;/g, ' ')  // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')     // Replace multiple spaces with a single space
        .trim();
    return text;
}

/**
 * Returns unformatted plain text from the given stub.
 *
 * Uses the DOM to strip out HTML & return the text content of the given blog stub.
 *
 * @param stub
 * @returns {string}
 */
export function extractTextFromStub(stub) {
    const html = [
        stub.title,
        stub.intro,
        stub.body,
    ].filter(t => t).join(' ');
    const text = extractTextFromHtml(html)
        .toLowerCase();
    return text;
}

