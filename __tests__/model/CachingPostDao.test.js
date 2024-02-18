import CachingPostDao from "@/model/CachingPostDao";

test('Should cache after retrieving a post by ID', async () => {
    const mockDao = {
        getLatestPost: jest.fn(() => ({ entryId: 1138 })),
        getPostById: jest.fn(() => ({}))
    };
    const dao = new CachingPostDao(mockDao)
    let post = await dao.getLatestPost();

    expect(mockDao.getLatestPost).toHaveBeenCalledTimes(1);
    expect(post.entryId).toBe(1138); // just double-checking

    let cached = await dao.getPostById(post.entryId);
    expect(mockDao.getPostById).not.toHaveBeenCalled();
    expect(cached.entryId).toBe(1138);
})

test('Should cache relationships between next & previous posts', async () => {
    const mockDao = {
        getPostById: jest.fn(() => ({ entryId: 1138 })),
        getPrevPost: jest.fn(() => ({ entryId: 1137})),
        getNextPost: jest.fn(() => ({}))
    };
    const dao = new CachingPostDao(mockDao);
    const post = await dao.getPostById(1138);
    const prev = await dao.getPrevPost(post);
    expect(post.entryId).toBe(1138);
    expect(prev.entryId).toBe(1137);

    // should know that prev's next is 1138
    const postAgain = await dao.getNextPost(prev);
    expect(mockDao.getNextPost).not.toHaveBeenCalled(); // don't call home; we already know
    expect(postAgain.entryId).toBe(1138); // find the right thing
})
