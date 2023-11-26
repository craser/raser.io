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
        });
}

export default class RawPostDao {
    #URL = 'http://localhost:8081/entries';

    constructor() {
    }

    async getLatestPost() {
        let url = `${this.#URL}/latest`;
        return cleanFetch(url).then(response => response.json());
    }

    async getPostById(id) {
        id = encodeURIComponent(id);
        let url = `${this.#URL}/${id}`;
        return cleanFetch(url).then(response => response.json());
    }

    async getNextPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = `${this.#URL}/${id}/next`
        return cleanFetch(url).then(response => response.json());
    }

    async getPrevPost(p) {
        let id = p.entryId || p;
        id = encodeURIComponent(id);
        let url = `${this.#URL}/${id}/prev`
        return cleanFetch(url).then(response => response.json());
    }

    /**
     * TODO: This is totally bogus. Limits to most recent 10 entries.
     * @returns {Promise<any>}
     */
    async getEntries(page = 0) {
        let url = `${this.#URL}/latest/${page}`;
        return cleanFetch(url).then(response => response.json())
            .then(posts => {
                return posts;
            });
    }

    async createPost(post) {
        let url = `${this.$URL}/entries/create`
        return cleanFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        }).then(response => response.json());
    }

    async updatePost(post) {
        let url = `${this.$URL}/entries/update`
        return cleanFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        }).then(response => response.json());
    }

}
