/**
 * TODO: This is a temporary solution to get data from the Firebase database.
 *
 * example URL: https://dmg-react-db-default-rtdb.firebaseio.com/entries.json?orderBy="Entry_ID"&equalTo=3378
 *
 * See docs: https://firebase.google.com/docs/database/rest/retrieve-data
 */

export default class PostDao {
    #URL = 'https://dmg-react-db-default-rtdb.firebaseio.com';

    constructor() {
    }

    async getLatestPost() {
        let url = `${this.#URL}/entries.json?orderBy="Entry_ID"&limitToLast=1`;
        return fetch(url).then(response => response.json())
            .then(data => {
                return data[Object.keys(data)[0]];
            });
    }

    async getPostById(id) {
        id = encodeURIComponent(id);
        let url = `${this.#URL}/entries.json?orderBy="Entry_ID"&equalTo=${id}`;
        return fetch(url).then(response => response.json())
            .then(data => {
                return data[Object.keys(data)[0]];
            });
    }

    /**
     * TODO: This is totally bogus. Limits to most recent 10 entries.
     * @returns {Promise<any>}
     */
    async getEntries() {
        let url = `${this.#URL}/entries.json?orderBy="Entry_ID"&limitToLast=10`;
        return fetch(url).then(response => response.json())
            .then(data => {
                let posts = Object.keys(data).map(key => data[key]);
                posts.sort((a, b) => b.Entry_ID - a.Entry_ID);
                return posts;
            });
    }

}
