// ABOUTME: Tests that YouTube iframes in post HTML become click-to-play thumbnails, and that
// ABOUTME: clicking one swaps in the real player, already playing.
import { YouTubeFacade } from '@/lib/html/YouTubeFacade';

const EMBED = '<iframe width="630" height="354"\r\nsrc="https://www.youtube-nocookie.com/embed/WPjJW0afKuw"\r\n'
    + 'title="YouTube video player" frameborder="0" allow="accelerometer;\r\nautoplay" allowfullscreen></iframe>';

function facadeIn(html) {
    const container = document.createElement('div');
    container.innerHTML = YouTubeFacade.replaceEmbeds(html);
    document.body.appendChild(container);
    return container;
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('YouTubeFacade.replaceEmbeds', () => {
    it('replaces a YouTube iframe with a button showing the video\'s thumbnail', () => {
        const container = facadeIn(`<p>before</p>${EMBED}<p>after</p>`);

        expect(container.querySelector('iframe')).toBeNull();
        const facade = container.querySelector('[data-testid="youtube-facade"]');
        expect(facade.tagName).toBe('BUTTON');
        expect(facade.getAttribute('data-youtube-src')).toBe('https://www.youtube-nocookie.com/embed/WPjJW0afKuw');
        expect(facade.style.backgroundImage).toBe('url(https://i.ytimg.com/vi/WPjJW0afKuw/hqdefault.jpg)');
        expect(container.querySelectorAll('p')).toHaveLength(2);
    });

    it('handles youtube.com embeds, single quotes and query strings', () => {
        const container = facadeIn(`<iframe src='https://www.youtube.com/embed/ab-C_12?start=30'></iframe>`);

        expect(container.querySelector('[data-testid="youtube-facade"]').getAttribute('data-youtube-src'))
            .toBe('https://www.youtube.com/embed/ab-C_12?start=30');
    });

    it('replaces every YouTube iframe in the markup', () => {
        const container = facadeIn(`${EMBED}<p>between</p>${EMBED}`);

        expect(container.querySelectorAll('[data-testid="youtube-facade"]')).toHaveLength(2);
    });

    it('leaves other iframes alone', () => {
        const markup = '<iframe src="https://player.vimeo.com/video/1"></iframe>';
        expect(YouTubeFacade.replaceEmbeds(markup)).toBe(markup);
    });

    it('passes missing markup through unchanged', () => {
        expect(YouTubeFacade.replaceEmbeds(undefined)).toBeUndefined();
    });
});

describe('YouTubeFacade.playClicked', () => {
    it('swaps a clicked thumbnail for the player, set to autoplay', () => {
        const container = facadeIn(EMBED);
        const facade = container.querySelector('[data-testid="youtube-facade"]');

        YouTubeFacade.playClicked({ target: facade });

        expect(container.querySelector('[data-testid="youtube-facade"]')).toBeNull();
        const player = container.querySelector('[data-testid="youtube-embed"]');
        expect(player.tagName).toBe('IFRAME');
        expect(player.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/WPjJW0afKuw?autoplay=1');
        expect(player.getAttribute('allow')).toContain('autoplay');
        expect(player.hasAttribute('allowfullscreen')).toBe(true);
    });

    it('keeps the embed\'s own query parameters', () => {
        const container = facadeIn(`<iframe src="https://www.youtube.com/embed/abc?start=30"></iframe>`);

        YouTubeFacade.playClicked({ target: container.querySelector('[data-testid="youtube-facade"]') });

        expect(container.querySelector('[data-testid="youtube-embed"]').getAttribute('src'))
            .toBe('https://www.youtube.com/embed/abc?start=30&autoplay=1');
    });

    it('ignores clicks anywhere else', () => {
        const container = facadeIn(`<p data-testid="text">text</p>${EMBED}`);

        YouTubeFacade.playClicked({ target: container.querySelector('[data-testid="text"]') });

        expect(container.querySelector('[data-testid="youtube-facade"]')).not.toBeNull();
        expect(container.querySelector('iframe')).toBeNull();
    });
});
