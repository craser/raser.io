// ABOUTME: Tests for the link builders in lib/util/Links.
// ABOUTME: Covers the in-app relative links and the absolute URLs feeds and metadata need.

import { getPostLink, getDownloadLink, getAbsoluteUrl } from '@/lib/util/Links';

jest.mock('/siteconfig.json', () => ({
    site: {
        url: 'https://example.com'
    }
}));

describe('getPostLink', () => {
    test('is relative, so in-app navigation stays on the current host', () => {
        expect(getPostLink({ entryId: 1138 })).toBe('/archive/1138');
    });
});

describe('getAbsoluteUrl', () => {
    test('puts the configured site URL in front of a relative path', () => {
        expect(getAbsoluteUrl('/archive/1138')).toBe('https://example.com/archive/1138');
    });

    test('builds an absolute post link when composed with getPostLink', () => {
        expect(getAbsoluteUrl(getPostLink({ entryId: 4 }))).toBe('https://example.com/archive/4');
    });

    test('builds an absolute download link when composed with getDownloadLink', () => {
        expect(getAbsoluteUrl(getDownloadLink('resume.pdf'))).toBe('https://example.com/d/resume.pdf');
    });

    test('leaves an already-absolute URL alone', () => {
        expect(getAbsoluteUrl('https://other.example/thing')).toBe('https://other.example/thing');
    });
});
