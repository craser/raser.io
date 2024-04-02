import { requestIdleCallback } from "next/dist/client/request-idle-callback";

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
        this.meta = {};
    }
}

export default class LruCache {
    #capacity;
    #size;
    first;
    last;
    map;

    constructor(capacity) {
        this.#capacity = capacity;
        this.#size = 0;
        this.map = {};

        const restored = this.#restoreFromLocalStorage();
        if (restored) {
            this.first = restored.first;
            this.last = restored.last;
            this.#size = restored.size;
            this.map = restored.map;
        }
    }

    #isLocalStorageAvailable = () => {
        return (typeof window != 'undefined')  && window.localStorage;
    }

    #writeToLocalStorage = () => {
        if (this.#isLocalStorageAvailable()) {
            window.requestIdleCallback(() => {
                const entries = [];
                for (let e = this.first; e != null; e = e.next) {
                    entries.push({ ...e, prev: null, next: null });
                }
                const json = JSON.stringify(entries);
                window.localStorage.setItem('rio-dao-cache', json);
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
                let json = JSON.parse(window.localStorage.getItem('rio-dao-cache'));
                if (json) {
                    const entries = json;
                    if (entries.length) {
                        cache.first = entries[0];
                        cache.last = entries[0];
                        cache.size = 1;
                        cache.map[entries[0].key] = entries[0];
                    }
                    for (let i = 1; i < entries.length; i++) {
                        let e = entries[i];
                        cache.last.next = e;
                        e.prev = cache.last;
                        cache.last = e;
                        cache.map[e.key] = e;
                    }
                }
            } catch (e) {
                console.error(e);
                cache.first = null;
                cache.last = null;
                cache.map = {};
                cache.size = 0;
                cache.capacity = cache.capacity || 30;
            }
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
