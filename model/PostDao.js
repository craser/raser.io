import LOG_ENTRIES from './DummyDataStore.js'

/**
 * Dummy data retrieval
 */

export default class PostDao {
    #ENTRIES = LOG_ENTRIES;

    constructor() {
    }

    async getLatestPost() {
        return this.#ENTRIES[0];
    }

    async getPostById(id) {
        return this.#ENTRIES.find(e => e.Entry_ID == id);
    }

    async getEntries() {
        return this.#ENTRIES;
    }

}
