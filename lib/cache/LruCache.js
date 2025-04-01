class Entry {
    key;
    value;
    prev;
    next;
    meta;

    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.next = null;
        this.prev = null;
        this.meta = {};
    }
}

export default class LruCache {
    #capacity;
    #size;
    #useLocalStorage;
    first;
    last;
    map;


    constructor(capacity, options = {}) {
        this.#capacity = capacity;
        this.#size = 0;
        this.map = {};
        if ('useLocalStorage' in options) {
            this.#useLocalStorage = options.useLocalStorage;
        } else {
            this.#useLocalStorage = true;
        }

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

    #writeToLocalStorage = () => {
        if (this.#isLocalStorageAvailable()) {
            this.#requestIdleCallback(() => {
                try {
                    console.log(`saving ${this.countEntries()} entries to localStorage... maybe?`);
                    const entries = []; // TODO: how is this getting over capacity?
                    for (let e = this.first; e != null && entries.length < this.#capacity; e = e.next) {
                        entries.push({ ...e, prev: null, next: null });
                    }
                    const json = JSON.stringify(entries);
                    window.localStorage.setItem('rio-dao-cache', json);
                } catch (e) { // 90% of the time, this is due to the JSON being too big.
                    debugger; // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
                    console.warn(`error writing ${this.#capacity} entries to localStorage`, e);
                    this.#capacity--;
                    if (this.#capacity > 0) {
                        setTimeout(() => this.#writeToLocalStorage(), 0);
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
                    if (entries.length) {
                        cache.first = entries[0];
                        cache.last = entries[0];
                        cache.size = 1;
                        cache.map[entries[0].key] = entries[0];
                    }
                    for (let i = 1; i < entries.length && this.#size < this.#capacity; i++) {
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
        const entry = new Entry(key, value);
        this.#prepend(entry);
        this.map[key] = entry;
        if (++this.#size > this.#capacity) {
            this.#delete(this.last);
            this.#size--;
        }
    }

    setMeta(key, meta) {
        if (key in this.map) {
            Object.assign(this.map[key].meta, meta);
            this.#writeToLocalStorage();
        }
    }

    getMeta(key) {
        if (key in this.map) {
            return this.map[key].meta;
        } else {
            return {};
        }
    }

    keys() {
        let ks = Object.keys(this.map);
        return ks;
    }

    get(key) {
        const entry = this.map[key];
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
