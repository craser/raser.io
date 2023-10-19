/**
 * Wrapper around a (Raw)PostDao that uses localStorage as a cache.
 */
import LocalStorageCache from "@/model/LocalStorageCache";

export default class CachingPostDao {
    #dao = null;
    #newCache;
    #MAX_CACHE_AGE = 1000 * 60 * 60 * 3; // 3 hours

    constructor(dao) {
        this.#dao = dao;
        this.#newCache = new LocalStorageCache();
    }

    async getLatestPost() {
        let post = this.#newCache.getLatestPost()
        if (!post) {
            post = await this.#dao.getLatestPost();
            this.#newCache.setLatestPost(post);
        }
        return post;
    }

    async getPostById(id) {
        let post = this.#newCache.getById(id);
        if (!post) {
            post = this.#dao.getPostById(id);
            this.#newCache.setById(post);
        }
        return post;
    }

    async getNextPost(id) {
        let post = this.#newCache.getNext(id);
        if (!post) {
            post = this.#dao.getNextPost(id);
            this.#newCache.setNext(id, post);
        }
        return post;
    }

    async getPrevPost(id) {
        let post = this.#newCache.getPrev(id);
        if (!post) {
            post = this.#dao.getPrevPost(id);
            this.#newCache.setPrev(id, post);
        }
        return post;
    }

    async getEntries() {
        let posts = this.#newCache.getRecentEntries();
        if (!posts) {
            let posts = this.#dao.getEntries();
            this.#newCache.setRecentEntries(posts);
        }
        return posts;
    }
}
