/**
 * Wrapper around a (Raw)PostDao that uses localStorage as a cache.
 */
import LocalStorageCache from "@/model/LocalStorageCache";

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

    async getNextPost(id) {
        let post = this.#cache.getNext(id);
        if (!post) {
            post = await this.#dao.getNextPost(id);
            this.#cache.setNext(id, post);
        }
        return post;
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
