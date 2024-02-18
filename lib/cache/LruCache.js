class Entry {
    key;
    value;
    prev;
    next;
    meta;

    constructor(key, value, prev, next) {
        this.key = key;
        this.value = value;
        this.next = next;
        this.meta = {};
    }
}

export default class LruCache {
    #capacity;
    #size;
    #first;
    #last;
    #map = {}; // key --> Entry<value>

    constructor(capacity) {
        this.#capacity = capacity;
        this.#size = 0;
    }

    #remove(entry) {
        if (entry.prev) {
            entry.prev.next = entry.next;
        } else {
            // entry was first
            this.#first = entry.next;
        }
        if (entry.next) {
            entry.next.prev = entry.prev;
        } else {
            // entry was last
            this.#last = entry.prev;
        }
        entry.next = null
        entry.prev = null;
        delete this.#map[entry.key];
        return entry;
    }

    #prepend(entry) {
        entry.next = this.#first;
        if (entry.next) {
            entry.next.prev = entry;
        }
        this.#first = entry;
        if (!this.#last) {
            this.#last = this.#first;
        }
    }

    put(key, value) {
        const entry = new Entry(key, value);
        this.#prepend(entry);
        this.#map[key] = entry;
        if (++this.#size > this.#capacity) {
            this.#remove(this.#last);
            this.#size--;
        }
    }

    setMeta(key, meta) {
        if (key in this.#map) {
            Object.assign(this.#map[key].meta, meta);
        }
    }

    getMeta(key) {
        if (key in this.#map) {
            return this.#map[key].meta;
        } else {
            return {};
        }
    }



    get(key) {
        const entry = this.#map[key];
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
        const entry = this.#first;
        if (entry) {
            return entry.value;
        } else {
            return null;
        }
    }

    getLruValue() {
        const entry = this.#last;
        if (entry) {
            return entry.value;
        } else {
            return null;
        }
    }
}
