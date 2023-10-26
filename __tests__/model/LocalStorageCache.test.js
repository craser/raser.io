import LocalStorageCache from 'model/LocalStorageCache'

let postId = 1000;
class MockPost {
    entryId = postId++;
}

function measureCacheSize(list) {
    if (list.next) {
        return 1 + measureCacheSize(list.next);
    } else {
        return 1;
    }
}

beforeEach(() => {
    jest.resetAllMocks();
});

test('basic get/set', () => {
    let cache = new LocalStorageCache();
    let a = new MockPost();
    let b = new MockPost();
    cache.setById(a);
    cache.setById(b);
    expect(cache.getById(a.entryId)).toBe(a);
    expect(cache.getById(b.entryId)).toBe(b);
})

test('next should set/return consistent results', () => {
    let cache = new LocalStorageCache();
    let a = new MockPost();
    let b = new MockPost();
    let c = new MockPost();
    cache.setNext(a, b);
    cache.setNext(b, c);

    expect(cache.getNext(a)).toBe(b);
    expect(cache.getNext(b)).toBe(c);
})

test('prev should set/return consistent results', () => {
    let cache = new LocalStorageCache();
    let a = new MockPost();
    let b = new MockPost();
    let c = new MockPost();
    cache.setPrev(a, b);
    cache.setPrev(b, c);

    expect(cache.getPrev(a)).toBe(b);
    expect(cache.getPrev(b)).toBe(c);
})

test('remove from posts, next, and prev A', () => {
    let cache = new LocalStorageCache();
    let a = new MockPost();
    let b = new MockPost();
    let c = new MockPost();
    cache.setById(a);
    cache.setById(b);
    cache.setById(c);
    cache.setNext(a, b);
    cache.setPrev(b, c);
    cache.setPrev(c, b);
    cache.setPrev(b, a);

    cache.remove(b);

    expect(cache.getById(b.entryId)).toBeFalsy();
    expect(cache.getNext(b.entryId)).toBeFalsy();
    expect(cache.getPrev(b.entryId)).toBeFalsy();
    expect(cache.getNext(a.entryId)).toBeFalsy();
    expect(cache.getPrev(c.entryId)).toBeFalsy();
})

test('remove from posts, next, and prev B', () => {
    let cache = new LocalStorageCache();
    let a = new MockPost();
    let b = new MockPost();
    let c = new MockPost();
    cache.setById(a);
    cache.setById(b);
    cache.setById(c);


    expect(cache.size).toBe(3);

    cache.remove(b);

    expect(cache.size).toBe(2);
    expect(measureCacheSize(cache.lruTop)).toBe(cache.size);
})

test('respect max size', () => {
    let cache = new LocalStorageCache();
    cache.maxSize = 5;
    for (let i = 0; i < 15; i++) {
        cache.setById(new MockPost());
        expect(cache.size).toBeLessThanOrEqual(5);
    }
})

test('boot the least-recently-used entry', () => {
    let cache = new LocalStorageCache();
    cache.maxSize = 3;
    let a = new MockPost();
    let b = new MockPost();
    let c = new MockPost();
    let d = new MockPost();
    cache.setById(a);
    cache.setById(b); // becomes lru & booted
    cache.setById(c);
    cache.getById(a.entryId); // a = mru
    cache.setById(d); // mru

    expect(cache.size).toBe(3);
    expect(cache.getById(b.entryId)).toBeFalsy();
    [a, c, d].forEach(e => {
        expect(cache.getById(e.entryId)).toBeTruthy()
    });

    for (let i = 0; i < 5; i++) {
        cache.setById(a);
    }
})

test('should correctly parse pickled json', () => {
    let pickled = null;
    let cacheName = null;
    global.localStorage = jest.mocked({
        getItem: jest.fn((name) => {
            cacheName = name; // name should be consistent
            return JSON.stringify(pickled);
        }),
        setItem: jest.fn((name, value) => {
            expect(name).toBe(cacheName); // name should be consistent
            pickled = value;
        })
    });

    let cacheA = new LocalStorageCache();
    let a = new MockPost();
    let b = new MockPost();
    let c = new MockPost();
    [a, b, c].forEach(p => cacheA.setById(p));
    cacheA.store();
    expect(global.localStorage.getItem).toHaveBeenCalledTimes(1);
    expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);

    let cacheB = new LocalStorageCache();
    cacheB.maxSize = 3;
    cacheB.setById(new MockPost()); // bump a
    expect(global.localStorage.getItem).toHaveBeenCalledTimes(2);
    expect(cacheB.getById(a.entryId)).toBeFalsy();
    [b, c].forEach(p => {
        expect(cacheB.getById(p.entryId)).toBeTruthy();
    });
})

test('should expire entries after 3 hours', () => {
    const Date = global.Date;
    try {
        let mockCurrentTime = 100;
        global.Date = jest.constructor(() => {
            return {
                getTime: jest.fn(() => mockCurrentTime)
            }
        });

        const cache = new LocalStorageCache();
        let post = new MockPost();
        cache.setById(post);
        expect(cache.getById(post.entryId)).toBe(post);
        // add 4 hours to the mockCurrentTime
        mockCurrentTime += 3 * 60 * 60 * 1000 + 1;
        expect(cache.getById(post.entryId)).toBeFalsy();
        expect(cache.size).toBe(0);
    }
    finally {
        global.Date = Date;
    }
})

test('should not be contaminated by previous global Date mock', () => {
    let mockCurrentTime = 3 * 60 * 60 * 1000 + 101;
    expect(new Date().getTime()).not.toBe(mockCurrentTime);
})

