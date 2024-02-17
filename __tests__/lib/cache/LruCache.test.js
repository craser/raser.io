import LruCache from '../../../lib/cache/LruCache'

test('should cache the last thing', () => {
    let cache = new LruCache();
    cache.put('one', 1);
    let value = cache.get('one')
    expect(value).toBe(1);
})

test('should return null for things that are not cached', () => {
    let cache = new LruCache();
    let value = cache.get('bogus');
    expect(value).toBeNull();
});

test('should correctly store the most-recently-used value', () => {
    let cache = new LruCache();
    let mru = cache.getMruValue();
    expect(mru).toBeNull();

    cache.put('one', 1);
    mru = cache.getMruValue();
    expect(mru).toBe(1);
})

test('should correctly store the least-recently-used value', () => {
    let cache = new LruCache();
    let lru = cache.getLruValue();
    expect(lru).toBeNull();

    cache.put('one', 1);
    lru = cache.getLruValue();
    expect(lru).toBe(1);
});

test('accessing a value should bump it to the top (bump last)', () => {
    let cache = new LruCache();
    cache.put('one', 1);
    cache.put('two', 2);
    cache.put('three', 3);
    cache.get('one');
    let mru = cache.getMruValue();
    let lru = cache.getLruValue();
    expect(mru).toBe(1);
    expect(lru).toBe(2);
})

test('accessing a value should bump it to the top (bump middle)', () => {
    let cache = new LruCache();
    cache.put('one', 1);
    cache.put('two', 2);
    cache.put('three', 3);
    cache.get('two');
    let mru = cache.getMruValue();
    let lru = cache.getLruValue();
    expect(mru).toBe(2);
    expect(lru).toBe(1);
})

test('accessing a value should bump it to the top (bump first)', () => {
    let cache = new LruCache();
    cache.put('one', 1);
    cache.put('two', 2);
    cache.put('three', 3);
    cache.get('three');
    let mru = cache.getMruValue();
    let lru = cache.getLruValue();
    expect(mru).toBe(3);
    expect(lru).toBe(1);
})

test('should drop LRU if capacity is exceeded', () => {
    let cache = new LruCache(3);
    expect(cache.getCapacity()).toBe(3);

    cache.put('one', 1);
    cache.put('two', 2);
    cache.put('three', 3);
    cache.put('four', 4);

    expect(cache.getMruValue()).toBe(4);
    expect(cache.getLruValue()).toBe(2);
    expect(cache.size()).toBe(3);
    expect(cache.get('one')).toBeNull();
    expect(cache.get('two')).toBe(2);
    expect(cache.get('three')).toBe(3);
    expect(cache.get('four')).toBe(4);
})




