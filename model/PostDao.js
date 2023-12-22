/**
 * TODO: This is a temporary solution to get data from the Firebase database.
 *
 * example URL: https://dmg-react-db-default-rtdb.firebaseio.com/entries.json?orderBy="Entry_ID"&equalTo=3378
 *
 * See docs: https://firebase.google.com/docs/database/rest/retrieve-data
 */
import { create } from "react-test-renderer";
import { auth } from "mysql/lib/protocol/Auth";
import getConfig from "@/lib/RaserIoConfig";

export default class RawPostDao {
    #config = getConfig();
    #Entries_URL = `${this.#config.api.root}${this.#config.api.endpoints.entries.entries}`
    //#Attachments_URL = 'http://localhost:5000/attachments';
    #Attachments_URL = `${this.#config.api.root}${this.#config.api.endpoints.attachments}`

    constructor() {
    }

    #auth(uri, authToken) {
        return `${uri}?${new URLSearchParams({ auth: authToken })}`;
    }

    #cleanFetch() {
        return fetch.apply(null, arguments)
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

    #postJson(create_url, object) {
        return this.#cleanFetch(create_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(object)
        });
    }

    #sendPost(url, post, attachments, authToken) {
        let formData = new FormData();
        let blob = new Blob([JSON.stringify(post)], { type: 'application/json' });
        formData.append('entry', blob);
        if (attachments) {
            attachments.forEach(a => formData.append('attachments', a));
        }
        return this.#cleanFetch(this.#auth(url, authToken), {
            method: 'POST',
            body: formData
        }).then(response => response.json());
    }

    async getLatestPost() {
        let url = `${this.#Entries_URL}/latest`;
        return this.#cleanFetch(url).then(response => response.json());
    }

    async getPostById(id) {
        id = encodeURIComponent(id);
        let url = `${this.#Entries_URL}/${id}`;
        return this.#cleanFetch(url).then(response => response.json());
    }

    async getNextPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = `${this.#Entries_URL}/${id}/next`
        return this.#cleanFetch(url)
            .then(response => response.json())
            .catch(() => null);
    }

    async getPrevPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = `${this.#Entries_URL}/${id}/prev`
        return this.#cleanFetch(url)
            .then(response => response.json())
            .catch(() => null);
    }

    /**
     * TODO: This is totally bogus. Limits to most recent 10 entries.
     * @returns {Promise<any>}
     */
    async getEntries(page = 0) {
        let url = `${this.#Entries_URL}/latest/${page}`;
        return this.#cleanFetch(url).then(response => response.json())
            .then(posts => {
                return posts;
            });
    }

    async createPost(email, authToken) {
        let url = `${this.#Entries_URL}/create?${new URLSearchParams({ email, auth: authToken })}`;
        return this.#cleanFetch(url, { method: "POST"})
            .then(response => response.json());
    }

    async publishPost(post, attachments, authToken) {
        let url = `${this.#Entries_URL}/publish`
        return this.#sendPost(url, post, attachments, authToken);
    }

    async updatePost(post, attachments, authToken) {
        let url = `${this.#Entries_URL}/update`;
        return this.#sendPost(url, post, attachments, authToken);
    }

    async deletePost(post, authToken) {
        let url = `${this.#Entries_URL}/delete?${new URLSearchParams({ id: post.entryId, auth: authToken })}`;
        return this.#cleanFetch(url);
    }

    async uploadAttachment(attachment, file, authToken) {
        let create_url = `${this.#Attachments_URL}/create`;
        return this.#postJson(this.#auth(create_url, authToken), attachment)
            .then(createdAttachment => {
                let upload_url = `${this.#Attachments_URL}/upload/${createdAttachment.attachmentId}`;
                let formData = new FormData();
                formData.append('attachment', JSON.stringify(attachment));
                formData.append('file', file);
                return this.#cleanFetch(upload_url, {
                    method: 'POST',
                    body: formData
                }).then(response => response.json());
            })
    }
}
