/**
 * TODO: This is a temporary solution to get data from the Firebase database.
 *
 * example URL: https://dmg-react-db-default-rtdb.firebaseio.com/entries.json?orderBy="Entry_ID"&equalTo=3378
 *
 * See docs: https://firebase.google.com/docs/database/rest/retrieve-data
 */

function cleanFetch() {
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

export default class RawPostDao {
    #Entries_URL = 'http://localhost:8081/entries';
    #Attachments_URL = 'http://localhost:8081/attachments';

    constructor() {
    }

    #auth(uri, authToken) {
        return `${uri}?${new URLSearchParams({ auth: authToken })}`;
    }

    async getLatestPost() {
        let url = `${this.#Entries_URL}/latest`;
        return cleanFetch(url).then(response => response.json());
    }

    async getPostById(id) {
        id = encodeURIComponent(id);
        let url = `${this.#Entries_URL}/${id}`;
        return cleanFetch(url).then(response => response.json());
    }

    async getNextPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = `${this.#Entries_URL}/${id}/next`
        return cleanFetch(url).then(response => response.json());
    }

    async getPrevPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = `${this.#Entries_URL}/${id}/prev`
        return cleanFetch(url).then(response => response.json());
    }

    /**
     * TODO: This is totally bogus. Limits to most recent 10 entries.
     * @returns {Promise<any>}
     */
    async getEntries(page = 0) {
        let url = `${this.#Entries_URL}/latest/${page}`;
        return cleanFetch(url).then(response => response.json())
            .then(posts => {
                return posts;
            });
    }

    async createPost(post, authToken) {
        let url = `${this.#Entries_URL}/create`
        return cleanFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        }).then(response => response.json());
    }

    async updatePost(post, authToken) {
        let url = `${this.#Entries_URL}/update`;
        return cleanFetch(this.#auth(url, authToken), {
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
        let url = `${this.#Attachments_URL}/create`
        return cleanFetch(this.#auth(url, authToken), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attachment)
        })
            .then(response => response.json())
            .then(attachment => this.uploadAttachment(attachment, titleImage, authToken));
    }

    async uploadAttachment(attachment, titleImage, authToken) {
        let url = `${this.#Attachments_URL}/test_upload/${attachment.attachmentId}`; // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
        let formData = new FormData();
        formData.append('file', titleImage);
        return cleanFetch(url, {
            method: 'POST',
            body: formData
        }).then(response => response.json());
    }

}
