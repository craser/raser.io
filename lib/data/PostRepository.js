// ABOUTME: Reads blog entries and their attachments from the database.
// ABOUTME: Returns the JSON shape the blog's client code expects; reach it via PostRepository.getInstance().

import Database from '@/lib/data/Database';

/**
 * Posts are presented newest first. Several entries share a timestamp, so entryId
 * breaks ties and keeps ordering - and therefore next/prev - stable.
 */
const POST_ORDER = 'date_posted DESC, entry_id ASC';

const POST_COLUMNS = `
    entry_id,
    allow_comments,
    body,
    to_char(date_posted, 'YYYY-MM-DD HH24:MI:SS.US') AS date_posted,
    image_file_name,
    image_file_type,
    intro,
    to_char(last_updated, 'YYYY-MM-DD HH24:MI:SS.US') AS last_updated,
    syndicate,
    title,
    user_id,
    user_name,
    via_text,
    via_title,
    via_url`;

const ATTACHMENT_COLUMNS = `
    attachment_id,
    activity_id,
    to_char(date_posted, 'YYYY-MM-DD HH24:MI:SS.US') AS date_posted,
    to_char(date_taken, 'YYYY-MM-DD HH24:MI:SS.US') AS date_taken,
    description,
    entry_id,
    file_name,
    file_type,
    is_gallery_image,
    mime_type,
    title,
    user_id,
    user_name`;

/** blog_entries.image_file_type holds the ordinal; callers expect the name. */
const IMAGE_FILE_TYPES = { 0: 'map', 1: 'image', 2: 'document' };

/** entry_id is a 32-bit column, so anything outside that range cannot match a row. */
const MAX_ENTRY_ID = 2147483647;

export default class PostRepository {
    static #instance = null;

    #database;

    static getInstance() {
        if (!PostRepository.#instance) {
            PostRepository.#instance = new PostRepository();
        }
        return PostRepository.#instance;
    }

    constructor(database = Database.getInstance()) {
        this.#database = database;
    }

    /**
     * Coerces a caller-supplied id to an integer, or null when it could never match a row.
     */
    #toEntryId(id) {
        const parsed = Number.parseInt(id, 10);
        if (Number.isNaN(parsed) || Math.abs(parsed) > MAX_ENTRY_ID) {
            return null;
        }
        return parsed;
    }

    #toPost(row) {
        return {
            entryId: row.entry_id,
            allowComments: row.allow_comments,
            body: row.body,
            datePosted: row.date_posted,
            imageFileName: row.image_file_name,
            imageFileType: IMAGE_FILE_TYPES[row.image_file_type] ?? row.image_file_type,
            intro: row.intro,
            lastUpdated: row.last_updated,
            syndicate: row.syndicate,
            title: row.title,
            userId: row.user_id,
            userName: row.user_name,
            viaText: row.via_text,
            viaTitle: row.via_title,
            viaUrl: row.via_url,
            attachments: [],
        };
    }

    #toAttachment(row) {
        return {
            attachmentId: row.attachment_id,
            activityId: row.activity_id,
            datePosted: row.date_posted,
            dateTaken: row.date_taken,
            description: row.description,
            entryId: row.entry_id,
            fileName: row.file_name,
            fileType: row.file_type,
            isGalleryImage: row.is_gallery_image,
            mimeType: row.mime_type,
            title: row.title,
            userId: row.user_id,
            userName: row.user_name,
        };
    }

    /**
     * Loads the attachments for the given posts and hangs them off their entries.
     */
    async #attachTo(posts) {
        if (posts.length === 0) {
            return posts;
        }
        const rows = await this.#database.query(
            `SELECT ${ATTACHMENT_COLUMNS} FROM attachments WHERE entry_id = ANY($1) ORDER BY attachment_id ASC`,
            [posts.map(p => p.entryId)]
        );
        const postsById = new Map(posts.map(p => [p.entryId, p]));
        rows.forEach(row => {
            postsById.get(row.entry_id)?.attachments.push(this.#toAttachment(row));
        });
        return posts;
    }

    async #selectPosts(where, params, order = POST_ORDER, limit = null) {
        const clauses = [`SELECT ${POST_COLUMNS} FROM blog_entries`];
        if (where) {
            clauses.push(`WHERE ${where}`);
        }
        clauses.push(`ORDER BY ${order}`);
        if (limit !== null) {
            clauses.push(limit);
        }
        const rows = await this.#database.query(clauses.join(' '), params);
        return this.#attachTo(rows.map(row => this.#toPost(row)));
    }

    /**
     * Returns one zero-indexed page of posts, newest first.
     */
    async getEntries(page = 0, pageSize = 10) {
        const posts = await this.#selectPosts(null, [pageSize, page * pageSize], POST_ORDER, 'LIMIT $1 OFFSET $2');
        return posts;
    }

    async getPostById(id) {
        const entryId = this.#toEntryId(id);
        if (entryId === null) {
            return null;
        }
        const posts = await this.#selectPosts('entry_id = $1', [entryId]);
        return posts[0] ?? null;
    }

    /**
     * Returns the chronologically newer neighbour - the post just ahead of this one
     * in the newest-first ordering - or null if this is already the newest.
     */
    async getNextPost(id) {
        return this.#adjacentPost(id, '>', '<', 'date_posted ASC, entry_id DESC');
    }

    /**
     * Returns the chronologically older neighbour, or null if this is already the oldest.
     */
    async getPrevPost(id) {
        return this.#adjacentPost(id, '<', '>', POST_ORDER);
    }

    /**
     * Walks one step through the newest-first ordering from the given post.
     *
     * @param dateComparison {string} how the neighbour's date_posted relates to the anchor's
     * @param tieComparison {string} how the neighbour's entry_id relates when the dates match
     * @param order {string} ordering that puts the closest neighbour first
     */
    async #adjacentPost(id, dateComparison, tieComparison, order) {
        const entryId = this.#toEntryId(id);
        if (entryId === null) {
            return null;
        }
        // The anchor columns are aliased so they cannot collide with the ones being selected.
        const rows = await this.#database.query(
            `WITH anchor AS (
                 SELECT date_posted AS anchor_date, entry_id AS anchor_entry_id
                 FROM blog_entries WHERE entry_id = $1
             )
             SELECT ${POST_COLUMNS}
             FROM blog_entries, anchor
             WHERE date_posted ${dateComparison} anchor_date
                OR (date_posted = anchor_date AND entry_id ${tieComparison} anchor_entry_id)
             ORDER BY ${order}
             LIMIT 1`,
            [entryId]
        );
        if (rows.length === 0) {
            return null;
        }
        const [post] = await this.#attachTo([this.#toPost(rows[0])]);
        return post;
    }

    /**
     * Returns up to numEntries posts, newest first, for the client-side search index.
     */
    async getSearchStubs(numEntries = 1000) {
        return this.#selectPosts(null, [numEntries], POST_ORDER, 'LIMIT $1');
    }
}
