import LruCache from '../../../lib/cache/LruCache'

afterEach(() => {
    delete global.window;
})

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

test('should correctly store & retrieve metadata', () => {
    let cache = new LruCache(5);
    cache.put('one', 1);
    cache.setMeta('one', { up: 'two'});
    cache.setMeta('one', { down: 'zero' });
    let meta = cache.getMeta('one');
    expect(meta.up).toBe('two');
    expect(meta.down).toBe('zero');
})

test('repeated gets should NOT remove item', () => {
    let cache = new LruCache(5);
    cache.put('one', 1);
    expect(cache.get('one')).toBe(1);
    expect(cache.get('one')).toBe(1); // again
})

test('should save to & restore from local storage', () => {
    let storedCache = null; // string

    global.window = {
        localStorage: {
            setItem: (key, value) => {
                storedCache = value; // string
            },
            getItem: (key) => {
                return storedCache;
            }
        },
        requestIdleCallback(callback, options) {
            callback();
        }
    }

    let cache = new LruCache(5);
    cache.put('one', 1);
    cache.put('two', 2);
    cache.setMeta('one', { up: 'two'});
    cache.setMeta('one', { down: 'zero' });
    let meta = cache.getMeta('one');
    expect(meta.up).toBe('two');
    expect(meta.down).toBe('zero');

    expect(storedCache).not.toBeNull();

    let restored = new LruCache(5);
    expect(restored.get('one')).toEqual(1);
    expect(restored.get('two')).toEqual(2);
    cache.keys().forEach(key => {
        expect(restored.get(key)).toEqual(cache.get(key));
        expect(restored.getMeta(key)).toEqual(cache.getMeta(key));
    });
})




