// ABOUTME: Swaps YouTube iframes in post HTML for click-to-play thumbnails, and a clicked thumbnail for the player.
// ABOUTME: Each player is about 1 MB of YouTube's scripts, so it's only loaded for a reader who wants to watch.

/**
 * A YouTube embed is drawn as a <button> holding the video's thumbnail. The real
 * <iframe> is built only when someone clicks it, and starts playing straight away,
 * so the click still plays the video in one step.
 *
 * The thumbnail is an <img> rather than a CSS background, so the browser finds it in
 * the HTML and fetches it straight away; it's often the largest thing on the page.
 */
export class YouTubeFacade {
    // A whole YouTube <iframe>...</iframe>; its attributes may span lines and use either quote.
    // Groups: 2 is the embed URL, 3 the video ID.
    static #EMBED = /<iframe\b[^>]*?\ssrc\s*=\s*(["'])(https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]+)[^"']*)\1[^>]*>\s*<\/iframe>/gi;

    static #PLAYER_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

    /** Returns html with every YouTube iframe replaced by a thumbnail button. */
    static replaceEmbeds(html) {
        if (!html) {
            return html;
        }
        return html.replace(YouTubeFacade.#EMBED, (iframe, quote, src, videoId) => {
            const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            return `<button type="button" class="youtube-facade" data-testid="youtube-facade"`
                + ` data-youtube-src="${src}" aria-label="Play video">`
                + `<img src="${thumbnail}" alt="" width="480" height="360"></button>`;
        });
    }

    /**
     * A click handler for any element holding post HTML: when the click landed on a
     * thumbnail, replaces it with the playing video. Other clicks are ignored.
     */
    static playClicked(event) {
        const facade = event.target.closest?.('[data-youtube-src]');
        if (!facade) {
            return;
        }
        const src = new URL(facade.getAttribute('data-youtube-src'));
        src.searchParams.set('autoplay', '1');

        const player = document.createElement('iframe');
        player.setAttribute('src', src.toString());
        player.setAttribute('title', 'YouTube video player');
        player.setAttribute('allow', YouTubeFacade.#PLAYER_ALLOW);
        player.setAttribute('allowfullscreen', '');
        player.setAttribute('class', 'youtube-embed');
        player.setAttribute('data-testid', 'youtube-embed');
        facade.replaceWith(player);
    }
}
