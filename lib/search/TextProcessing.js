export function extractTextFromHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent
        .replaceAll(/\s+/g, ' ');
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

