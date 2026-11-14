// ABOUTME: A least-recently-used cache with per-entry metadata, mirrored to the browser's localStorage.
// ABOUTME: Holds one entry per key; drops the oldest once capacity is exceeded, and any entry older than maxAgeMs.

class Entry {
    key;
    value;
    prev;
    next;
    meta;
    created;

    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.next = null;
        this.prev = null;
        this.meta = {};
        this.created = Date.now();
    }
}

export default class LruCache {
    #capacity;
    #size;
    #useLocalStorage;
    #maxAgeMs;
    first;
    last;
    map;


    /**
     * @param capacity {number} the most entries to hold
     * @param options.useLocalStorage {boolean} mirror entries to localStorage (default true)
     * @param options.maxAgeMs {number} how long an entry stays valid after it is put; omit to keep entries indefinitely
     */
    constructor(capacity, options = {}) {
        this.#capacity = capacity;
        this.#size = 0;
        this.map = {};
        if ('useLocalStorage' in options) {
            this.#useLocalStorage = options.useLocalStorage;
        } else {
            this.#useLocalStorage = true;
        }
        this.#maxAgeMs = options.maxAgeMs ?? null;

        const restored = this.#restoreFromLocalStorage();
        if (restored) {
            this.first = restored.first;
            this.last = restored.last;
            this.#size = restored.size;
            this.map = restored.map;
        }
    }

    #isLocalStorageAvailable = () => {
        if (!this.#useLocalStorage) {
            return false;
        } else {
            return (typeof window != 'undefined') && window.localStorage;
        }
    }

    /**
     * Just a stopgap until I can figure out a polyfill or something.
     *
     * @param f - run this function in a way that causes the least possible performance drag.
     */
    #requestIdleCallback(f) {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(f);
        } else {
            window.setTimeout(f, 0);
        }
    }

    countEntries() {
        let count = 0;
        for (let e = this.first; e != null; e = e.next) {
            count++;
        }
        return count;
    }

    /**
     * @param maxEntries {number} the most entries to write; each failed write retries with one fewer,
     *        leaving the capacity of the in-memory cache unchanged
     */
    #writeToLocalStorage = (maxEntries = this.#capacity) => {
        if (this.#isLocalStorageAvailable()) {
            this.#requestIdleCallback(() => {
                try {
                    console.log(`saving ${this.countEntries()} entries to localStorage... maybe?`);
                    const entries = []; // TODO: how is this getting over capacity?
                    for (let e = this.first; e != null && entries.length < maxEntries; e = e.next) {
                        entries.push({ ...e, prev: null, next: null });
                    }
                    const json = JSON.stringify(entries);
                    window.localStorage.setItem('rio-dao-cache', json);
                } catch (e) { // 90% of the time, this is due to the JSON being too big.
                    console.warn(`error writing ${maxEntries} entries to localStorage`, e);
                    if (maxEntries > 1) {
                        setTimeout(() => this.#writeToLocalStorage(maxEntries - 1), 0);
                    }
                }
            });
        }
    }

    #restoreFromLocalStorage = () => {
        if (!this.#isLocalStorageAvailable()) {
            return null;
        } else {
            const cache = {
                first: null,
                last: null,
                size: 0,
                map: {}
            };
            try {
                let entries = JSON.parse(window.localStorage.getItem('rio-dao-cache'));
                if (entries) {
                    entries = entries.filter(e => !this.#isExpired(e));
                    if (entries.length) {
                        cache.first = entries[0];
                        cache.last = entries[0];
                        cache.size = 1;
                        cache.map[entries[0].key] = entries[0];
                    }
                    for (let i = 1; i < entries.length && cache.size < this.#capacity; i++) {
                        let e = entries[i];
                        cache.last.next = e;
                        e.prev = cache.last;
                        cache.last = e;
                        cache.map[e.key] = e;
                        cache.size++;
                    }
                }
            } catch (e) {
                console.error(e);
                cache.first = null;
                cache.last = null;
                cache.map = {};
                cache.size = 0;
                cache.capacity = cache.capacity || 100;
            }
            this.#size = cache.size;
            return cache;
        }
    }

    /**
     * An entry restored from localStorage without a timestamp has an unknown age, so it counts as expired.
     */
    #isExpired(entry) {
        if (this.#maxAgeMs === null) {
            return false;
        }
        return typeof entry.created !== 'number' || Date.now() - entry.created > this.#maxAgeMs;
    }

    /**
     * Returns the entry for key, or undefined when there is none or it has expired. Expired entries are evicted.
     */
    #liveEntry(key) {
        const entry = this.map[key];
        if (entry && this.#isExpired(entry)) {
            this.#delete(entry);
            this.#size--;
            return undefined;
        }
        return entry;
    }

    #delete(entry) {
        this.#remove(entry); // remove from lru list
        delete this.map[entry.key];
    }

    #remove(entry) {
        if (entry.prev) {
            entry.prev.next = entry.next;
        } else {
            // entry was first
            this.first = entry.next;
        }
        if (entry.next) {
            entry.next.prev = entry.prev;
        } else {
            // entry was last
            this.last = entry.prev;
        }
        entry.next = null
        entry.prev = null;
        return entry;
    }

    #prepend(entry) {
        entry.next = this.first;
        if (entry.next) {
            entry.next.prev = entry;
        }
        this.first = entry;
        if (!this.last) {
            this.last = this.first;
        }

        this.#writeToLocalStorage();
    }

    put(key, value) {
        if (key in this.map) {
            this.#delete(this.map[key]);
            this.#size--;
        }
        const entry = new Entry(key, value);
        this.#prepend(entry);
        this.map[key] = entry;
        if (++this.#size > this.#capacity) {
            this.#delete(this.last);
            this.#size--;
        }
    }

    setMeta(key, meta) {
        if (this.#liveEntry(key)) {
            Object.assign(this.map[key].meta, meta);
            this.#writeToLocalStorage();
        }
    }

    getMeta(key) {
        const entry = this.#liveEntry(key);
        if (entry) {
            return entry.meta;
        } else {
            return {};
        }
    }

    keys() {
        let ks = Object.keys(this.map);
        return ks;
    }

    get(key) {
        const entry = this.#liveEntry(key);
        if (entry) {
            this.#remove(entry);
            this.#prepend(entry);
            return entry.value;
        } else {
            return null;
        }
    }

    size() {
        return this.#size;
    }

    getCapacity() {
        return this.#capacity;
    }

    getMruValue() {
        const entry = this.first;
        if (entry) {
            return entry.value;
        } else {
            return null;
        }
    }

    getLruValue() {
        const entry = this.last;
        if (entry) {
            return entry.value;
        } else {
            return null;
        }
    }
}
