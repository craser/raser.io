// ABOUTME: Fetches posts from the site's /api/entries endpoints for browser components.
// ABOUTME: Requests reject with the underlying error; next/prev resolve to null when there is no neighbour.

import SiteConfig from "@/lib/SiteConfig";
import CachingPostDao from "@/model/CachingPostDao";
import EdgeConfigPostDao from "@/model/EdgeConfigPostDao";

export default class PostDao {
    #config = new SiteConfig();

    static getCachingPostDao() {
        return new CachingPostDao(new PostDao());
    }

    static getEdgePostDao() {
        return new EdgeConfigPostDao();
    }

    // TODO: Nobody should still be calling this. Replace with getCachaingPostDao().
    static getPostDao() {
        return new PostDao();
    }


    constructor() {
    }

    /**
     * Fetches the given URL, rejecting with an Error carrying the HTTP status if the response is not ok.
     */
    #cleanFetch(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    const error = new Error(`HTTP error! status: ${response.status} fetching ${url}`);
                    error.status = response.status;
                    throw error;
                } else {
                    return response;
                }
            });
    }

    /**
     * Fetches a post that may legitimately not exist: resolves to null on a 404, rejects on any other failure.
     */
    #fetchPostOrNull(url) {
        return this.#cleanFetch(url)
            .then(response => response.json())
            .catch(e => {
                if (e.status === 404) {
                    return null;
                }
                throw e;
            });
    }

    async getLatestPost() {
        const page = 0;
        const pageSize = 1;
        let url = this.#config.getEndpoint('entries.latest', { page, pageSize });
        return this.#cleanFetch(url)
            .then(response => response.json())
            .then(p=> p[0]);
    }

    async getPostById(id) {
        id = encodeURIComponent(id);
        let url = this.#config.getEndpoint('entries.entry', { id });
        return this.#cleanFetch(url).then(response => response.json());
    }

    async getNextPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = this.#config.getEndpoint('entries.next', { id });
        return this.#fetchPostOrNull(url);
    }

    async getPrevPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = this.#config.getEndpoint('entries.previous', { id });
        return this.#fetchPostOrNull(url);
    }

    /**
     * TODO: This is totally bogus. Limits to most recent 10 entries.
     * @returns {Promise<any>}
     */
    async getEntries(page = 0, pageSize = 10) {
        let url = this.#config.getEndpoint('entries.latest', { page, pageSize });
        return this.#cleanFetch(url).then(response => response.json())
    }

    /**
     * Returns one zero-indexed page of the posts carrying the given tag, newest first.
     */
    async getEntriesByTag(tag, page = 0, pageSize = 10) {
        tag = encodeURIComponent(tag);
        let url = this.#config.getEndpoint('entries.tagged', { tag, page, pageSize });
        return this.#cleanFetch(url).then(response => response.json());
    }

    async getSearchStubs(numEntries = 1000) {
        let url = this.#config.getEndpoint('entries.bulk', { numEntries });
        return this.#cleanFetch(url)
            .then(response => response.json());
    }
}
