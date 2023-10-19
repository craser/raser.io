let INITIAL_CACHE = {
    next: {}, // prevId -> nextId
    prev: {}, // nextId -> prevId
    latest: null, // latest post
    recentEntries: null, // most recent posts
};
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
    #CACHE_NAME = 'raserio-cache';
    cache = INITIAL_CACHE;

    constructor() {
        try {
            if (localStorage) {
                const json = localStorage.getItem(this.#CACHE_NAME);
                this.cache = JSON.parse(json) || INITIAL_CACHE;
            }
        } catch (e) {
            console.error('Error initializing new cache.', e);
        }
    }

    store() {
        if (localStorage) {
            localStorage.setItem(this.#CACHE_NAME, cache);
        }
    }

    getById(entryId) {
        return this.cache[entryId];
    }

    setById(post) {
        this.cache[post.entryId] = post;
    }

    setNext(prevId, post) {
        this.setById(post);
        this.cache.next[prevId] = post.entryId;
    }

    getNext(prevId) {
        let entryId = this.cache.next[prevId];
        let post = entryId && this.getById(entryId);
        return post;
    }

    setPrev(nextId, post) {
        this.setById(post)
        this.cache.prev[nextId] = post.entryId;
    }

    getPrev(nextId) {
        let entryId = this.cache.prev[nextId];
        let post = entryId && this.getById(entryId);
        return post;
    }

    getLatestPost() {
        return this.cache.latest;
    }

    setLatestPost(post) {
        this.cache.latest = post;
    }

    getRecentEntries() {
        return this.cache.recentEntries;
    }

    setRecentEntries(posts) {
        this.cache.recentEntries = posts;
    }
}
