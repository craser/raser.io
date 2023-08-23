/**
 * Dummy data retrieval
 */

export default class PostDao {

    #ENTRIES = [
        {
            id: 'DUMMY_ID_0',
            title: 'DUMMY_TITLE_0',
            intro: 'DUMMY_INTRO_0',
            body: 'DUMMY_BODY_0'
        },
        {
            id: 'DUMMY_ID_1',
            title: 'DUMMY_TITLE_1',
            intro: 'DUMMY_INTRO_1',
            body: 'DUMMY_BODY_1'
        }
        ];

    constructor() {
    }

    async getLatestPost() {
        return this.#ENTRIES[0];
    }

    async getPostById(id) {
        return this.#ENTRIES.find(e => e.id == id);
    }

    async getEntries() {
        return this.#ENTRIES;
    }

}
