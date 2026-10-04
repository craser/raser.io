/**
 * ABOUTME: Tests for the local checks run on a post folder before anything touches the network.
 * ABOUTME: Builds folder objects in memory; the file system is covered by the PostFolder tests.
 *
 * @jest-environment node
 */

import { validatePostFolder } from '@/lib/publish/validate';

const file = (path) => ({ path, name: path.split('/').pop() });

function folder({ post = {}, intro = '<p>i</p>', body = '', files = ['images/hero.jpg', 'docs/route.pdf'] } = {}) {
    return { post: { title: 'My Trip', ...post }, intro, body, files: files.map(file) };
}

test('a minimal folder is valid', () => {
    expect(validatePostFolder(folder())).toEqual([]);
});

test('a leap day is a valid datePosted', () => {
    expect(validatePostFolder(folder({ post: { datePosted: '2028-02-29 23:59' } }))).toEqual([]);
});

test('a fully filled-in folder is valid', () => {
    const valid = folder({
        post: {
            datePosted: '2026-10-03 14:30',
            titleImage: 'images/hero.jpg',
            via: { url: 'https://example.com', title: 'Example', text: 'via' },
            tags: ['bikes'],
            attachments: [{ path: 'images/hero.jpg', title: 'Hero', gallery: true }],
            entryId: 3421
        },
        intro: '<img src="images/hero.jpg">',
        body: '<a href="docs/route.pdf">route</a>'
    });

    expect(validatePostFolder(valid)).toEqual([]);
});

test.each([
    ['blank title', { post: { title: '  ' } }, '"title"'],
    ['missing title', { post: { title: undefined } }, '"title"'],
    ['date without time', { post: { datePosted: '2026-10-03' } }, '"datePosted"'],
    ['month 13', { post: { datePosted: '2026-13-01 10:00' } }, '"datePosted"'],
    ['February 30', { post: { datePosted: '2026-02-30 10:00' } }, '"datePosted"'],
    ['hour 24', { post: { datePosted: '2026-10-03 24:00' } }, '"datePosted"'],
    ['minute 60', { post: { datePosted: '2026-10-03 10:60' } }, '"datePosted"'],
    ['titleImage in docs/', { post: { titleImage: 'docs/route.pdf' } }, '"titleImage"'],
    ['entryId as a string', { post: { entryId: '3421' } }, '"entryId"'],
    ['titleImage not in folder', { post: { titleImage: 'images/nope.jpg' } }, '"titleImage"'],
    ['via not an object', { post: { via: 'x' } }, '"via"'],
    ['via field not a string', { post: { via: { url: 5 } } }, '"via.url"'],
    ['tags not an array', { post: { tags: 'bikes' } }, '"tags"'],
    ['blank tag', { post: { tags: [''] } }, '"tags"'],
    ['attachments not an array', { post: { attachments: {} } }, '"attachments" must be an array'],
    ['attachment without path', { post: { attachments: [{ title: 'x' }] } }, 'attachments[0] needs a "path"'],
    ['attachment path not in folder', { post: { attachments: [{ path: 'images/nope.jpg' }] } }, 'attachments[0] "images/nope.jpg"'],
    ['attachment listed twice', { post: { attachments: [{ path: 'images/hero.jpg' }, { path: 'images/hero.jpg' }] } }, 'listed twice'],
    ['missing intro.html', { intro: null }, 'intro.html is missing'],
    ['two files with one name', { files: ['images/x.jpg', 'docs/x.jpg'] }, '"x.jpg" appears more than once'],
    ['intro references a missing file', { intro: '<img src="images/nope.jpg">' }, 'intro.html: "images/nope.jpg"'],
    ['body references a missing file', { body: '<a href="docs/nope.pdf">x</a>' }, 'body.html: "docs/nope.pdf"']
])('reports %s', (description, args, expected) => {
    expect(validatePostFolder(folder(args)).join('\n')).toContain(expected);
});

test('reports every problem at once', () => {
    const errors = validatePostFolder(folder({ post: { title: '', titleImage: 'images/nope.jpg' }, intro: null }));

    expect(errors).toHaveLength(3);
});
