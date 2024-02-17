/**
 * Wrapper around a (Raw)PostDao that uses localStorage as a cache.
 */
import LocalStorageCache from "@/model/LocalStorageCache";
import PostDao from "@/model/PostDao";

export default class CachingPostDao {
    #dao = null;
    #cache;

    constructor(dao) {
        this.#dao = dao;
        this.#cache = new LocalStorageCache();
    }

    async getLatestPost() {
        let post = await this.#dao.getLatestPost();
        return post;
    }

    async getPostById(id) {
        let post = this.#cache.getById(id);
        if (!post) {
            post = await this.#dao.getPostById(id);
            this.#cache.setById(post);
        }
        return post;
    }

    async getNextPost(prev) {
        let next = this.#cache.getNext(prev);
        console.debug({ message: 'CachingPostDao', cached: next });
        if (!next) {
            next = await this.#dao.getNextPost(prev);
            console.debug({ message: 'CachingPostDao', fetched: next});
            this.#cache.setNext(prev, next);
        }
        return next;
    }

    async getPrevPost(id) {
        let post = this.#cache.getPrev(id);
        if (!post) {
            post = await this.#dao.getPrevPost(id);
            this.#cache.setPrev(id, post);
        }
        return post;
    }

    async getEntries() {
        let posts = await this.#dao.getEntries();
        return posts;
    }
}
