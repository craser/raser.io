/**
 * Wrapper around a (Raw)PostDao that uses localStorage as a cache.
 */

function CacheEntry(post) {
    this.timestamp = Date.now();
    this.post = post;
}

export default class CachingPostDao {
    #dao = null;
    #cache = null; // Entry_ID -> Post
    #MAX_CACHE_AGE = 1000 * 60 * 60 * 3; // 3 hours

    constructor(dao) {
        this.#dao = dao;
        this.#cache = this.getCache();
    }

    getCache() {
        try {
            let cache = JSON.parse(localStorage.getItem('posts'));
            return cache || {};
        } catch (e) {
            console.error(e);
            return {};
        }
    }

    setCache() {
        localStorage.setItem('posts', JSON.stringify(this.#cache));
    }

    async getLatestPost() {
        let cache = this.#cache;
        let cacheEntry = cache['latestPost'];
        if (!cacheEntry || (Date.now() - cacheEntry.timestamp) > this.#MAX_CACHE_AGE) {
            let post = await this.#dao.getLatestPost();
            this.#cache['latestPost'] = new CacheEntry(post);
            this.setCache();
            return post;
        } else {
            return cacheEntry.post;
        }
    }

    async getPostById(id) {
        let start = Date.now();
        let cache = this.#cache;
        let cacheEntry = cache[id];
        if (!cacheEntry || (Date.now() - cacheEntry.timestamp) > this.#MAX_CACHE_AGE) {
            let post = await this.#dao.getPostById(id);
            this.#cache[id] = new CacheEntry(post);
            this.setCache();
            console.log(`getPostById(${id}) took ${Date.now() - start}ms (cache miss)`);
            return post;
        } else {
            console.log(`getPostById(${id}) took ${Date.now() - start}ms (cache hit)`);
            return cacheEntry.post;
        }
    }

    async getEntries() {
        let cacheEntry = this.#cache['entries'];
        if (!cacheEntry || (Date.now() - cacheEntry.timestamp) > this.#MAX_CACHE_AGE) {
            let posts = await this.#dao.getEntries();
            this.#cache['entries'] = new CacheEntry(posts);
            this.setCache();
            return posts;
        } else {
            return cacheEntry.post;
        }
    }
}
