import PostToHtml from '@/model/PostToHtml';

describe('PostToHtml', () => {
    const html = (markup) => new PostToHtml({ intro: markup, body: markup });

    it('returns the intro and body as HTML', () => {
        const postHtml = new PostToHtml({ intro: '<p>intro</p>', body: '<p>body</p>' });
        expect(postHtml.getIntro()).toBe('<p>intro</p>');
        expect(postHtml.getBody()).toBe('<p>body</p>');
    });

    it('makes relative hrefs root-relative', () => {
        expect(html('<a href="archive/2692">x</a>').getBody()).toBe('<a href="/archive/2692">x</a>');
        expect(html('<a href="archive/2692">x</a>').getIntro()).toBe('<a href="/archive/2692">x</a>');
    });

    it('makes relative srcs root-relative', () => {
        expect(html('<img src="images/foo.jpg">').getBody()).toBe('<img src="/images/foo.jpg">');
    });

    it('handles single-quoted attributes, other attributes, and odd spacing', () => {
        expect(html(`<a class="x" HREF = 'archive/1' title="t">x</a>`).getBody())
            .toBe(`<a class="x" HREF = '/archive/1' title="t">x</a>`);
    });

    it('normalizes every link in the markup', () => {
        expect(html('<a href="archive/1">a</a> <a href="tags/foo">b</a>').getBody())
            .toBe('<a href="/archive/1">a</a> <a href="/tags/foo">b</a>');
    });

    it.each([
        'https://example.com/page',
        'http://example.com/page',
        '//cdn.example.com/x.js',
        '/archive/2692',
        '#fn1',
        '?page=2',
        'mailto:chris@example.com',
        'tel:5551234',
        'data:image/png;base64,AAAA',
        '',
    ])('leaves %p untouched', (url) => {
        const markup = `<a href="${url}">x</a>`;
        expect(html(markup).getBody()).toBe(markup);
    });

    it('does not touch text that merely looks like an attribute', () => {
        const markup = '<p>set data-href="archive/1" here</p>';
        expect(html(markup).getBody()).toBe(markup);
    });

    it('passes missing intro and body through unchanged', () => {
        const postHtml = new PostToHtml({});
        expect(postHtml.getIntro()).toBeUndefined();
        expect(postHtml.getBody()).toBeUndefined();
    });
});
