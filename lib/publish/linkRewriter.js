// ABOUTME: Finds and rewrites src/href values in post HTML that point at files in the post folder.
// ABOUTME: Lets the HTML reference images/hero.jpg locally while the stored post uses the CDN URL.

/** A src or href attribute with a single- or double-quoted value. */
const ATTRIBUTE = /\b(src|href)\s*=\s*(["'])(.*?)\2/gi;

const FOLDER_REFERENCE = /^(images|docs)\//;

export function findFolderReferences(html) {
    const references = [];
    for (const match of (html ?? '').matchAll(ATTRIBUTE)) {
        const value = normalize(match[3]);
        if (FOLDER_REFERENCE.test(value)) {
            references.push(value);
        }
    }
    return references;
}

export function rewriteLinks(html, files, cdnBaseUrl) {
    const namesByPath = new Map(files.map(file => [file.path, file.name]));
    return html.replace(ATTRIBUTE, (whole, attribute, quote, value) => {
        const name = namesByPath.get(normalize(value));
        return name ? `${attribute}=${quote}${cdnUrl(cdnBaseUrl, name)}${quote}` : whole;
    });
}

export function cdnUrl(cdnBaseUrl, name) {
    return `${cdnBaseUrl}/${encodeURIComponent(name)}`;
}

/** Decodes %20 and friends and drops a leading "./", so equivalent spellings compare equal. */
function normalize(value) {
    let decoded;
    try {
        decoded = decodeURIComponent(value);
    } catch {
        decoded = value;
    }
    return decoded.replace(/^\.\//, '');
}
