// ABOUTME: Tests for PostDao — verifies the read-only interface after write method removal.
// ABOUTME: Confirms write methods and dead factory methods no longer exist on PostDao.

import PostDao from '@/model/PostDao';

describe('PostDao read methods', () => {
    test('getCachingPostDao() returns an object with read methods', () => {
        const dao = PostDao.getCachingPostDao();
        expect(typeof dao.getLatestPost).toBe('function');
        expect(typeof dao.getPostById).toBe('function');
        expect(typeof dao.getNextPost).toBe('function');
        expect(typeof dao.getPrevPost).toBe('function');
        expect(typeof dao.getEntries).toBe('function');
        expect(typeof dao.getSearchStubs).toBe('function');
    });
});

describe('PostDao write methods are removed', () => {
    test('createPost does not exist on PostDao instance', () => {
        expect(new PostDao().createPost).toBeUndefined();
    });

    test('publishPost does not exist on PostDao instance', () => {
        expect(new PostDao().publishPost).toBeUndefined();
    });

    test('updatePost does not exist on PostDao instance', () => {
        expect(new PostDao().updatePost).toBeUndefined();
    });

    test('deletePost does not exist on PostDao instance', () => {
        expect(new PostDao().deletePost).toBeUndefined();
    });
});

describe('PostDao dead factory methods are removed', () => {
    test('getPostDao static method does not exist', () => {
        expect(PostDao.getPostDao).toBeUndefined();
    });

    test('getEdgePostDao static method does not exist', () => {
        expect(PostDao.getEdgePostDao).toBeUndefined();
    });
});
