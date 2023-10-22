function LruList({ post, nextPostId, prevPostId, next }) {
    this.id = post.entryId;
    this.post = post;
    this.nextPostId = nextPostId;
    this.prevPostId = prevPostId;
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
    #CACHE_NAME = 'raserio-cache';
    lruById = {};
    lruTop = null;
    lruTail = null;
    recentEntries = null;
    latestEntry = null;
    maxSize = 20;


    constructor({ maxSize }) {
        try {
            if (typeof localStorage != 'undefined') {
                const json = localStorage.getItem(this.#CACHE_NAME);
                this.cache = JSON.parse(json) || INITIAL_CACHE;
            }
            this.maxSize = maxSize;
        } catch (e) {
            console.error('Error initializing new cache.', e);
        }
    }

    store() {
        if (typeof localStorage != 'undefined') {
            localStorage.setItem(this.#CACHE_NAME, this.cache);
        }
    }

    remove(post) {
        if (post.entryId in this.lruById) {
            let entry = this.lruById[post.entryId];
            delete this.lruById[post.entryId];
            Object.assign(entry, entry.next);
            this.size--;
        }
    }

    removeOldest() {

    }

    getById(entryId) {
        return (entryId in this.lruById)
            ? this.lruById[entryId].post
            : null;
    }

    setById(post) {
        const newEntry = new LruList({ post, next: this.lruTop });
        if (post.entryId in this.lruById) {
            const entry = this.lruById[post.entryId];
            Object.assign(entry, entry.next);
        } else {
            this.size++;
        }
        this.lruTop = newEntry;
        this.lruTail = this.lruTail || newEntry;
        this.lruById[post.entryId] = newEntry;
    }

    setNext(post, nextPost) {
        this.setById(post);
        this.setById(nextPost);
        this.lruById[post.entryId].nextPostId = nextPost.entryId;
        this.lruById[nextPost.entryId].prevPostId = post.entryId;
    }

    getNext(p) {
        const id = p.entryId || p;
        const entry = this.lruById[id];
        const nextPost = entry
            ? this.getById(entry.nextPostId)
            : null;
        return nextPost;
    }

    setPrev(post, prevPost) {
        this.setById(post);
        this.setById(prevPost);
        this.lruById[post.entryId].prevPostId = prevPost.entryId;
        this.lruById[prevPost.entryId].nextPostId = post.entryId;
    }

    getPrev(p) {
        const id = p.entryId || p;
        const entry  = this.lruById[id];
        const prevPost = entry
            ? this.getById(entry.prevPostId)
            : null;
        return prevPost;
    }

    getLatestPost() {
        return this.latestEntry;
    }

    setLatestPost(post) {
        this.latestEntry = post;
    }

    getRecentEntries() {
        return this.recentEntries;
    }

    setRecentEntries(posts) {
        this.recentEntries = posts;
    }
}
