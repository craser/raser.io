import CachingPostDao from "./CachingPostDao";
import RawPostDao from "./RawPostDao";

/**
 * TODO: This is a temporary solution to get data from the Firebase database.
 *
 * example URL: https://dmg-react-db-default-rtdb.firebaseio.com/entries.json?orderBy="Entry_ID"&equalTo=3378
 *
 * See docs: https://firebase.google.com/docs/database/rest/retrieve-data
 */

export default class PostDao {
    #dao = null;

    constructor() {
        this.#dao = new CachingPostDao(new RawPostDao());
    }

    async getLatestPost() {
        return this.#dao.getLatestPost();
    }

    async getPostById(id) {
        return this.#dao.getPostById(id);
    }

    async getEntries() {
        return this.#dao.getEntries();
    }
}
