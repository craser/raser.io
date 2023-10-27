function LruList({ post, nextPostId, prevPostId, next, prev }) {
    this.created = new Date().getTime();
    this.id = post.entryId;
    this.post = post;
    this.nextPostId = nextPostId;
    this.prevPostId = prevPostId;
    this.prev = prev;
    this.next = next;
}

/**
 * Implements an object cache backed by browser's local storage. If used
 * in an environment where localStorage is NOT available, it will still
 * act as if everything is normal, but will use a local object as the
 * cache and be (obviously) unable to actually store anything.
 *
 * TODO: Periodically invalidate cache entries.
 * TODO: Actually flush to localStorage...
 */
export default class LocalStorageCache {
    size = 0;
    maxAgeMs = 3 * 60 * 60 * 1000; // 3 hours
    #CACHE_NAME = 'raserio-cache';
    lruById = {};
    lruTop = null;
    lruTail = null;
    maxSize = 20;

    constructor() {
        try {
            if (typeof localStorage != 'undefined') {
                const json = localStorage.getItem(this.#CACHE_NAME);
                const pickled = JSON.parse(json); // just a list of all the entries
                pickled.posts.reverse().forEach(e => this.setById(e));
            }
        } catch (e) {
            console.warn('Error initializing new cache.', e);
        }
    }

    checkExpired(entry, f) {
        if (!entry) return null;
        const now = new Date().getTime();
        const age = now - entry.created;
        const expired = age > this.maxAgeMs;
        if (expired) {
            this.remove(entry.post);
            return null;
        } else {
            this.bump(entry.post);
            return f(entry);
        }
    }

    store() {
        if (typeof localStorage != 'undefined') {
            const posts = [];
            for (let e = this.lruTop; e != null; e = e.next) {
                posts.push(e.post);
            }
            localStorage.setItem(this.#CACHE_NAME, { posts });
        }
    }

    remove(post) {
        if (post.entryId in this.lruById) {
            let entry = this.lruById[post.entryId];
            if (entry.prev) {
                entry.prev.next = entry.next;
            }
            if (entry.next) {
                entry.next.prev = entry.prev;
            }
            delete this.lruById[post.entryId];
            this.size--;
        }
    }

    bump(post) {
        const entry = this.lruById[post.entryId];
        if (this.lruTail === entry) {
            this.lruTail = entry.prev || entry;
        }
        if (entry.prev) {
            entry.prev.next = entry.next;
        }
        if (entry.next) {
            entry.next.prev = entry.prev;
        }
        entry.next = this.lruTop;
        this.lruTop = entry;
    }

    removeOldest() {
        const entry = this.lruTail;
        this.lruTail = entry.prev;
        entry.prev.next = null;
        delete this.lruById[entry.post.entryId];
        this.size--;
    }

    getById(entryId) {
        if (entryId in this.lruById) {
            let entry = this.lruById[entryId];
            return this.checkExpired(entry, (entry) => {
                return entry.post;
            });
        }
    }

    setById(post) {
        if (!(post.entryId in this.lruById)) {
            const entry = new LruList({ post, next: this.lruTop });
            if (entry.next) {
                entry.next.prev = entry;
            }
            this.lruTop = entry;
            this.lruTail = this.lruTail || entry;
            this.lruById[post.entryId] = entry;
            this.size++;
        }
        if (this.size > this.maxSize) {
            this.removeOldest();
        }
    }

    setNext(prev, next) {
        this.setById(prev);
        this.setById(next);
        this.lruById[prev.entryId].nextPostId = next.entryId;
        this.lruById[next.entryId].prevPostId = prev.entryId;
    }

    getNext(p) {
        const id = p.entryId || p;
        const entry = this.lruById[id];
        return this.checkExpired(entry, (entry) => {
            return this.getById(entry.nextPostId);
        });
    }

    setPrev(next, prev) {
        this.setById(next);
        this.setById(prev);
        this.lruById[next.entryId].prevPostId = prev.entryId;
        this.lruById[prev.entryId].nextPostId = next.entryId;
    }

    getPrev(p) {
        const id = p.entryId || p;
        const entry  = this.lruById[id];
        return this.checkExpired(entry, (entry) => {
            return this.getById(entry.prevPostId);
        });
    }
}
