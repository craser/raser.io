/**
 * ABOUTME: Tests for --gen, which creates a new post folder from the template.
 * ABOUTME: Works in a temporary directory so nothing lands in the repo's posts/ folder.
 *
 * @jest-environment node
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createPostScaffold, POST_TEMPLATE } from '@/lib/publish/PostScaffold';
import PublishError from '@/lib/publish/PublishError';

let root;

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-'));
});

afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
});

test('creates the folder with template files and empty images/ and docs/', () => {
    const dir = createPostScaffold(root, 'my-trip');

    expect(dir).toBe(path.join(root, 'my-trip'));
    expect(fs.readdirSync(dir).sort()).toEqual(['body.html', 'docs', 'images', 'intro.html', 'post.json']);
    expect(fs.readdirSync(path.join(dir, 'images'))).toEqual([]);
    expect(fs.readdirSync(path.join(dir, 'docs'))).toEqual([]);
});

test('post.json holds the template, including the attachment example', () => {
    const dir = createPostScaffold(root, 'my-trip');
    const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8'));

    expect(post).toEqual({
        title: '',
        datePosted: null,
        titleImage: null,
        via: { url: null, title: null, text: null },
        tags: [],
        attachments: [],
        _attachmentExample: {
            path: 'images/hero.jpg',
            title: 'Halls Lake',
            description: 'Optional longer description',
            gallery: false
        },
        entryId: null
    });
    expect(post).toEqual(POST_TEMPLATE);
});

test('intro.html and body.html hold placeholder paragraphs', () => {
    const dir = createPostScaffold(root, 'my-trip');

    expect(fs.readFileSync(path.join(dir, 'intro.html'), 'utf-8')).toContain('<p>');
    expect(fs.readFileSync(path.join(dir, 'body.html'), 'utf-8')).toContain('<p>');
});

test('creates the posts root when it does not exist yet', () => {
    const dir = createPostScaffold(path.join(root, 'posts'), 'my-trip');

    expect(fs.existsSync(path.join(dir, 'post.json'))).toBe(true);
});

test('refuses an existing folder and leaves it untouched', () => {
    fs.mkdirSync(path.join(root, 'my-trip'));
    fs.writeFileSync(path.join(root, 'my-trip', 'keep.txt'), 'mine');

    expect(() => createPostScaffold(root, 'my-trip')).toThrow(PublishError);
    expect(fs.readdirSync(path.join(root, 'my-trip'))).toEqual(['keep.txt']);
});

test.each(['', '../escape', 'a/b', '.hidden'])('rejects the folder name %p', (name) => {
    expect(() => createPostScaffold(root, name)).toThrow(PublishError);
});

test('PublishError carries details', () => {
    const error = new PublishError('bad', ['one', 'two']);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PublishError');
    expect(error.message).toBe('bad');
    expect(error.details).toEqual(['one', 'two']);
    expect(new PublishError('plain').details).toEqual([]);
});
