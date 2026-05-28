// ABOUTME: Read-only data access object for blog post entries.
// ABOUTME: Fetches posts from the API; use getCachingPostDao() for cached access.

import SiteConfig from "@/lib/SiteConfig";
import CachingPostDao from "@/model/CachingPostDao";
import { formatUrl } from "@/lib/util/StringFormatter"

export default class PostDao {
    #config = new SiteConfig();

    static getCachingPostDao() {
        return new CachingPostDao(new PostDao());
    }

    constructor() {
    }

    #api(path, params) {
        let template = `${this.#config.api.root}${path}`;
        let url = formatUrl(template, params);
        return url;
    }

    #cleanFetch(...args) {
        return fetch(...args)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                } else {
                    return response;
                }
            })
            .catch(e => {
                console.error({ e, arguments });
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
        return this.#cleanFetch(url)
            .then(response => response.json())
            .catch(() => null);
    }

    async getPrevPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = this.#config.getEndpoint('entries.previous', { id });
        return this.#cleanFetch(url)
            .then(response => response.json())
            .catch(() => null);
    }

    /**
     * TODO: This is totally bogus. Limits to most recent 10 entries.
     * @returns {Promise<any>}
     */
    async getEntries(page = 0, pageSize = 10) {
        let url = this.#config.getEndpoint('entries.latest', { page, pageSize });
        return this.#cleanFetch(url).then(response => response.json())
    }

    async getSearchStubs(numEntries = 1000) {
        let url = this.#config.getEndpoint('entries.bulk', { numEntries });
        return this.#cleanFetch(url)
            .then(response => response.json());
    }
}
