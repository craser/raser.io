import LocalStorageCache from 'model/LocalStorageCache'

class MockPost {
    entryId = Math.round(Math.random() * 10000);
}

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

test('remove from posts, next, and prev', () => {
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

test('remove from posts, next, and prev', () => {
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
})





