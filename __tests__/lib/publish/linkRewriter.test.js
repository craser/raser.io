/**
 * ABOUTME: Tests for finding and rewriting folder-relative src/href values in post HTML.
 * ABOUTME: Pure string functions; no file system or network.
 *
 * @jest-environment node
 */

import { findFolderReferences, rewriteLinks, cdnUrl } from '@/lib/publish/linkRewriter';

const CDN = 'https://cdn.example';
const FILES = [
    { path: 'images/hero.jpg', name: 'hero.jpg' },
    { path: 'docs/my route.pdf', name: 'my route.pdf' }
];

describe('rewriteLinks', () => {
    test('rewrites a src that names a file in the folder', () => {
        expect(rewriteLinks('<img src="images/hero.jpg">', FILES, CDN)).toBe('<img src="https://cdn.example/hero.jpg">');
    });

    test('rewrites single-quoted values and keeps the quote style', () => {
        expect(rewriteLinks("<a href='images/hero.jpg'>x</a>", FILES, CDN)).toBe("<a href='https://cdn.example/hero.jpg'>x</a>");
    });

    test('accepts a leading ./', () => {
        expect(rewriteLinks('<img src="./images/hero.jpg">', FILES, CDN)).toBe('<img src="https://cdn.example/hero.jpg">');
    });

    test('matches percent-encoded references and encodes the CDN URL', () => {
        expect(rewriteLinks('<a href="docs/my%20route.pdf">r</a>', FILES, CDN)).toBe('<a href="https://cdn.example/my%20route.pdf">r</a>');
    });

    test('matches attribute names in any case', () => {
        expect(rewriteLinks('<IMG SRC="images/hero.jpg">', FILES, CDN)).toBe('<IMG SRC="https://cdn.example/hero.jpg">');
    });

    test('leaves everything else alone', () => {
        const html = '<a href="https://example.com/images/hero.jpg">a</a><a href="archive/3419">b</a><img src="images/missing.jpg">';

        expect(rewriteLinks(html, FILES, CDN)).toBe(html);
    });
});

describe('findFolderReferences', () => {
    test('returns normalized images/ and docs/ references in order', () => {
        const html = '<img src="images/a.jpg"><a href="docs/b%20c.pdf">x</a><a href="archive/1">y</a><img src=\'./images/d.jpg\'>';

        expect(findFolderReferences(html)).toEqual(['images/a.jpg', 'docs/b c.pdf', 'images/d.jpg']);
    });

    test('handles empty and missing HTML', () => {
        expect(findFolderReferences('')).toEqual([]);
        expect(findFolderReferences(null)).toEqual([]);
    });
});

describe('cdnUrl', () => {
    test('encodes the file name', () => {
        expect(cdnUrl(CDN, 'a b.jpg')).toBe('https://cdn.example/a%20b.jpg');
    });
});
