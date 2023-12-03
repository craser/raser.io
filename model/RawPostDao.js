/**
 * TODO: This is a temporary solution to get data from the Firebase database.
 *
 * example URL: https://dmg-react-db-default-rtdb.firebaseio.com/entries.json?orderBy="Entry_ID"&equalTo=3378
 *
 * See docs: https://firebase.google.com/docs/database/rest/retrieve-data
 */
import { create } from "react-test-renderer";
import { auth } from "mysql/lib/protocol/Auth";

export default class RawPostDao {
    #Entries_URL = 'http://localhost:8081/entries';
    #Attachments_URL = 'http://localhost:8081/attachments';

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
        return this.#cleanFetch(url).then(response => response.json());
    }

    async getPrevPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = `${this.#Entries_URL}/${id}/prev`
        return this.#cleanFetch(url).then(response => response.json());
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

    async createPost(post, authToken) {
        let url = `${this.#Entries_URL}/create`
        return this.#cleanFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        }).then(response => response.json());
    }

    async updatePost(post, authToken) {
        let url = `${this.#Entries_URL}/update`;
        return this.#cleanFetch(this.#auth(url, authToken), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        }).then(response => response.json());
    }

    async setTitleImage(post, titleImage, authToken) {
        let attachment = {
            userId: post.userId,
            userName: post.userName,
            entryId: post.entryId,
            isGalleryImage: true,
            fileName: titleImage.name,
            mimeType: titleImage.type,
            fileType: 'image',
            title: post.title,
        }
        return this.uploadAttachment(attachment, titleImage, authToken);
    }

    async uploadAttachment(attachment, file, authToken) {
        let create_url = `${this.#Attachments_URL}/create`;
        return this.#postJson(this.#auth(create_url, authToken), attachment)
            .then(response => response.json())
            .then(createdAttachment => {
                let upload_url = `${this.#Attachments_URL}/upload/${createdAttachment.attachmentId}`;
                let formData = new FormData();
                formData.append('auth', authToken);
                formData.append('file', file);
                return this.#cleanFetch(upload_url, {
                    method: 'POST',
                    body: formData
                }).then(response => response.json());
            })
    }

}
