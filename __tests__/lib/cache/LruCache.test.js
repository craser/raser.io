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





test('restoring from localStorage keeps no more entries than the capacity', () => {
    const stored = JSON.stringify(['one', 'two', 'three', 'four', 'five'].map((key, i) => (
        { key, value: i + 1, meta: {}, created: Date.now() }
    )));
    global.window = {
        localStorage: {
            setItem: () => {},
            getItem: () => stored
        },
        requestIdleCallback(callback) {
            callback();
        }
    };

    let restored = new LruCache(3);
    expect(restored.size()).toBe(3);
    expect(restored.countEntries()).toBe(3);
    expect(restored.get('one')).toBe(1);
    expect(restored.get('three')).toBe(3);
    expect(restored.get('four')).toBeNull();
    expect(restored.get('five')).toBeNull();
})

test('a failed localStorage write does not shrink the capacity of the cache', () => {
    jest.useFakeTimers();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const MAX_STORED_ENTRIES = 2;
    let storedCache = null;
    global.window = {
        localStorage: {
            setItem: (key, value) => {
                if (JSON.parse(value).length > MAX_STORED_ENTRIES) {
                    throw new Error('DUMMY_QUOTA_EXCEEDED');
                }
                storedCache = value;
            },
            getItem: () => null
        },
        requestIdleCallback(callback) {
            callback();
        }
    };

    try {
        let cache = new LruCache(3);
        cache.put('one', 1);
        cache.put('two', 2);
        cache.put('three', 3);
        jest.runAllTimers();

        expect(warn).toHaveBeenCalled();
        expect(JSON.parse(storedCache).map(e => e.key)).toEqual(['three', 'two']);
        expect(cache.getCapacity()).toBe(3);

        cache.put('four', 4);
        jest.runAllTimers();
        expect(cache.size()).toBe(3);
        expect(cache.get('two')).toBe(2);
        expect(cache.get('three')).toBe(3);
        expect(cache.get('four')).toBe(4);
    } finally {
        warn.mockRestore();
        jest.useRealTimers();
    }
})

test('putting a key that is already cached replaces its entry rather than adding a second one', () => {
    let cache = new LruCache(5);
    cache.put('one', 1);
    cache.put('two', 2);
    cache.put('one', 'uno');

    expect(cache.size()).toBe(2);
    expect(cache.countEntries()).toBe(2);
    expect(cache.get('one')).toBe('uno');
    expect(cache.getMruValue()).toBe('uno');
    expect(cache.getLruValue()).toBe(2);
})

test('re-putting a cached key does not push other entries out of a full cache', () => {
    let cache = new LruCache(2);
    cache.put('one', 1);
    cache.put('two', 2);
    cache.put('two', 'dos');

    expect(cache.get('one')).toBe(1);
    expect(cache.get('two')).toBe('dos');
})

describe('entry expiry', () => {
    const HOUR = 60 * 60 * 1000;
    const START = new Date('2026-11-14T12:00:00Z').getTime();

    beforeEach(() => {
        jest.useFakeTimers({ now: START });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('serves an entry until it is older than maxAgeMs', () => {
        let cache = new LruCache(5, { useLocalStorage: false, maxAgeMs: HOUR });
        cache.put('one', 1);
        jest.setSystemTime(START + HOUR);
        expect(cache.get('one')).toBe(1);
    })

    test('treats an entry older than maxAgeMs as not cached', () => {
        let cache = new LruCache(5, { useLocalStorage: false, maxAgeMs: HOUR });
        cache.put('one', 1);
        jest.setSystemTime(START + HOUR + 1);
        expect(cache.get('one')).toBeNull();
        expect(cache.size()).toBe(0);
    })

    test('drops the metadata of an expired entry', () => {
        let cache = new LruCache(5, { useLocalStorage: false, maxAgeMs: HOUR });
        cache.put('one', 1);
        cache.setMeta('one', { next: 'two' });
        jest.setSystemTime(START + HOUR + 1);
        expect(cache.getMeta('one')).toEqual({});
    })

    test('putting a key again restarts its age', () => {
        let cache = new LruCache(5, { useLocalStorage: false, maxAgeMs: HOUR });
        cache.put('one', 1);
        jest.setSystemTime(START + HOUR);
        cache.put('one', 'uno');
        jest.setSystemTime(START + HOUR + HOUR);
        expect(cache.get('one')).toBe('uno');
    })

    test('never expires entries when no maxAgeMs is given', () => {
        let cache = new LruCache(5, { useLocalStorage: false });
        cache.put('one', 1);
        jest.setSystemTime(START + 1000 * HOUR);
        expect(cache.get('one')).toBe(1);
    })

    test('does not restore entries from localStorage that have expired or carry no timestamp', () => {
        const stored = JSON.stringify([
            { key: 'fresh', value: 1, meta: {}, created: START - HOUR },
            { key: 'expired', value: 2, meta: {}, created: START - HOUR - 1 },
            { key: 'untimed', value: 3, meta: {} }
        ]);
        global.window = {
            localStorage: {
                setItem: () => {},
                getItem: () => stored
            },
            requestIdleCallback(callback) {
                callback();
            }
        };

        let restored = new LruCache(5, { maxAgeMs: HOUR });
        expect(restored.size()).toBe(1);
        expect(restored.get('fresh')).toBe(1);
        expect(restored.get('expired')).toBeNull();
        expect(restored.get('untimed')).toBeNull();
    })
});
