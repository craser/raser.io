// ABOUTME: Tests toListedPost, which trims a post down to what a post listing renders:
// ABOUTME: everything but the body, which listings never show.

import { toListedPost } from '@/lib/data/PostListings';

const post = {
    entryId: 3421,
    title: 'A post',
    intro: '<p>The intro.</p>',
    body: '<p>The long body.</p>',
    tags: ['joshuatree'],
    attachments: []
};

describe('toListedPost', () => {
    it('leaves out the body', () => {
        expect(toListedPost(post).body).toBeNull();
    });

    it('keeps everything else about the post', () => {
        const listed = toListedPost(post);
        expect(listed).toEqual({ ...post, body: null });
    });

    it('does not change the post it was given', () => {
        toListedPost(post);
        expect(post.body).toBe('<p>The long body.</p>');
    });
});
