/**
 * Returns unformatted plain text from the given stub.
 *
 * Uses the DOM to strip out HTML & return the text content of the given blog stub.
 *
 * @param stub
 * @returns {string}
 */
export function extractText(stub) {
    const div = document.createElement('div');
    div.innerHTML = [
        stub.title,
        stub.intro,
        stub.body,
    ].filter(t => t).join(' ');
    const text = div.textContent
        .replaceAll(/\s+/g, ' ')
        .toLowerCase();
    return text;
}
