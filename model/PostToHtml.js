/**
 * Renders a Post's content as HTML that's ready to drop into the page.
 *
 * Callers should get post HTML from here rather than reading the post's
 * fields directly, so they don't depend on how posts are stored.
 *
 * Relative URLs (e.g. href="archive/2692") are made root-relative
 * (href="/archive/2692"), because otherwise the browser resolves them
 * against whatever page the post happens to be shown on.
 */
export default class PostToHtml {
    // Matches an href or src attribute value, quoted with either ' or ".
    static #URL_ATTR = /(\s(?:href|src)\s*=\s*)(["'])(.*?)\2/gi;

    // URLs that already resolve the same from every page: a scheme
    // (https:, mailto:, data:...), root- or protocol-relative, a fragment,
    // or a query string.
    static #NOT_RELATIVE = /^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i;

    #post;

    constructor(post) {
        this.#post = post;
    }

    getIntro() {
        return PostToHtml.#normalize(this.#post.intro);
    }

    getBody() {
        return PostToHtml.#normalize(this.#post.body);
    }

    static #normalize(html) {
        if (!html) {
            return html;
        }
        return html.replace(PostToHtml.#URL_ATTR, (attr, prefix, quote, url) => {
            return (url && !PostToHtml.#NOT_RELATIVE.test(url))
                ? `${prefix}${quote}/${url}${quote}`
                : attr;
        });
    }
}
