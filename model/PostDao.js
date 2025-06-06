import SiteConfig from "@/lib/SiteConfig";
import CachingPostDao from "@/model/CachingPostDao";
import { formatUrl } from "@/lib/util/StringFormatter"
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

    #api(path, params) {
        let template = `${this.#config.api.root}${path}`;
        let url = formatUrl(template, params);
        return url;
    }

    #auth(name, { authToken, email }) {
        let uri = this.#config.getEndpoint(name);
        let params = new URLSearchParams({ auth: authToken });
        if (email) {
            params.set('email', email);
        }
        return `${uri}?${params}`;
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

    #sendPost(endpointName, post, attachments, authToken) {
        let formData = new FormData();
        let blob = new Blob([JSON.stringify(post)], { type: 'application/json' });
        formData.append('entry', blob);
        if (attachments) {
            attachments.forEach(a => formData.append('attachments', a));
        }
        return this.#cleanFetch(this.#auth(endpointName, { authToken }), {
            method: 'POST',
            body: formData
        }).then(response => response.json());
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

    async createPost(email, authToken) {
        let url = this.#auth('entries.create', { email, authToken });
        return this.#cleanFetch(url, { method: "POST" })
            .then(response => response.json());
    }

    async publishPost(post, attachments, authToken) {
        return this.#sendPost('entries.publish', post, attachments, authToken);
    }

    async updatePost(post, attachments, authToken) {
        return this.#sendPost('entries.update', post, attachments, authToken);
    }

    async deletePost(post, authToken) {
        let url = this.#api(this.#config.api.endpoints.entries.delete, { id: post.entryId, authToken });
        return this.#cleanFetch(url);
    }
}
