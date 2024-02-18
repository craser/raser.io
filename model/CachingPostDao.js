/**
 * Wrapper around a (Raw)PostDao that uses localStorage as a cache.
 */
import LruCache from '@/lib/cache/LruCache'

export default class CachingPostDao {
    #dao = null;
    #cache;

    constructor(dao) {
        this.#dao = dao;
        this.#cache = new LruCache(30); // TODO: replace this with some reasoned-out number/logic
    }

    async getLatestPost() {
        let post = await this.#dao.getLatestPost();
        return post;
    }

    async getPostById(id) {
        let post = this.#cache.get(id);
        if (!post) {
            post = await this.#dao.getPostById(id);
            this.#cache.put(post.entryId, post);
        }
        return post;
    }

    async getNextPost(prev) {
        let meta = this.#cache.getMeta(prev.entryId);
        console.log({ prev, meta });
        if (meta.next) {
            return await this.getPostById(meta.next);
        } else {
            let next = await this.#dao.getNextPost(prev);
            if (next) {
                this.#cache.put(next.entryId, next);
                this.#cache.setMeta(next.entryId, { prev: prev.entryId });
                this.#cache.setMeta(prev.entryId, { next: next.entryId });
            }
            return next;
        }
    }

    async getPrevPost(next) {
        let meta = this.#cache.getMeta(next.entryId);
        if (meta.prev) {
            return await this.getPostById(meta.prev);
        } else {
            let prev = await this.#dao.getPrevPost(next);
            if (prev) {
                this.#cache.put(prev.entryId, prev);
                this.#cache.setMeta(next.entryId, { prev: prev.entryId });
                this.#cache.setMeta(prev.entryId, { next: next.entryId });
            }
            return prev;
        }
    }

    async getEntries() {
        let posts = await this.#dao.getEntries();
        posts.forEach((p, i) => {
            this.#cache.put(p.entryId, p); // cache the entry;
            if (posts[i + 1]) {
                let prev = posts[i + 1]; // previous in TIME, presented in reverse-chronological order
                this.#cache.setMeta(p.entryId,  { prev: prev.entryId});
                this.#cache.setMeta(prev.entryId, { next: p.entryId });
            }
        });
        return posts;
    }
}
