// ABOUTME: Reads and writes blog posts in the database on behalf of the publisher.
// ABOUTME: Writes each post in one transaction, retrying when CockroachDB asks the client to.

import PublishError from '@/lib/publish/PublishError';

/** SQLSTATE CockroachDB returns when a transaction must be retried by the client. */
const RETRY_ERROR = '40001';
const MAX_ATTEMPTS = 3;

export default class PostWriter {
    #pool;

    /**
     * @param pool {{query: Function, connect: Function}} a pg Pool
     */
    constructor({ pool }) {
        this.#pool = pool;
    }

    /**
     * @returns {Promise<{entryId: number, attachmentNames: Set<string>}|null>}
     */
    async findEntry(entryId) {
        const entries = await this.#pool.query('SELECT entry_id FROM blog_entries WHERE entry_id = $1', [entryId]);
        if (entries.rows.length === 0) {
            return null;
        }
        const attachments = await this.#pool.query('SELECT file_name FROM attachments WHERE entry_id = $1', [entryId]);
        return { entryId, attachmentNames: new Set(attachments.rows.map(row => row.file_name)) };
    }

    /**
     * Inserts or updates the entry, then replaces its attachments and tags, all in one transaction.
     *
     * @returns {Promise<number>} the entry's ID
     */
    async write(record) {
        for (let attempt = 1; ; attempt += 1) {
            const client = await this.#pool.connect();
            try {
                await client.query('BEGIN');
                const entryId = await this.#writeEntry(client, record);
                await this.#replaceAttachments(client, entryId, record);
                await this.#replaceTags(client, entryId, record.tags);
                await client.query('COMMIT');
                return entryId;
            } catch (error) {
                await client.query('ROLLBACK').catch(() => {});
                if (error.code !== RETRY_ERROR || attempt >= MAX_ATTEMPTS) {
                    throw error;
                }
            } finally {
                client.release();
            }
        }
    }

    async #writeEntry(client, record) {
        const values = [
            record.title, record.intro, record.body, record.datePosted, record.lastUpdated,
            record.imageFileName, record.imageFileType, record.viaUrl, record.viaTitle, record.viaText
        ];
        if (record.entryId == null) {
            // entry_id has no default or sequence. CockroachDB transactions are serializable,
            // so a concurrent publish that read the same MAX forces one of them to retry.
            const { rows } = await client.query('SELECT COALESCE(MAX(entry_id), 0) + 1 AS next_id FROM blog_entries');
            const entryId = Number(rows[0].next_id);
            await client.query(
                `INSERT INTO blog_entries (entry_id, title, intro, body, date_posted, last_updated,
                    image_file_name, image_file_type, via_url, via_title, via_text,
                    allow_comments, syndicate, user_id, user_name)
                 VALUES ($1, $2, $3, $4, $5::TIMESTAMP, $6::TIMESTAMP, $7, $8, $9, $10, $11, 'false', 'false', $12, $13)`,
                [entryId, ...values, record.userId, record.userName]
            );
            return entryId;
        }
        const result = await client.query(
            `UPDATE blog_entries SET title = $2, intro = $3, body = $4, date_posted = $5::TIMESTAMP,
                last_updated = $6::TIMESTAMP, image_file_name = $7, image_file_type = $8,
                via_url = $9, via_title = $10, via_text = $11
             WHERE entry_id = $1`,
            [record.entryId, ...values]
        );
        if (result.rowCount !== 1) {
            throw new PublishError(`Entry ${record.entryId} from post.json does not exist in the database.`);
        }
        return record.entryId;
    }

    async #replaceAttachments(client, entryId, record) {
        await client.query('DELETE FROM attachments WHERE entry_id = $1', [entryId]);
        if (record.attachments.length === 0) {
            return;
        }
        const { rows } = await client.query('SELECT COALESCE(MAX(attachment_id), 0) AS max_id FROM attachments');
        let attachmentId = Number(rows[0].max_id);
        for (const attachment of record.attachments) {
            attachmentId += 1;
            await client.query(
                `INSERT INTO attachments (attachment_id, entry_id, file_name, file_type, mime_type, title,
                    description, is_gallery_image, date_posted, user_id, user_name)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::TIMESTAMP, $10, $11)`,
                [
                    attachmentId, entryId, attachment.fileName, attachment.fileType, attachment.mimeType,
                    attachment.title, attachment.description, attachment.isGallery ? 'true' : 'false',
                    record.datePosted, record.userId, record.userName
                ]
            );
        }
    }

    async #replaceTags(client, entryId, tags) {
        await client.query('DELETE FROM tag_links WHERE object_id = $1', [entryId]);
        if (tags.length === 0) {
            return;
        }
        const { rows } = await client.query('SELECT tag_id, name FROM tags WHERE name = ANY($1)', [tags]);
        const tagIds = new Map(rows.map(row => [row.name, row.tag_id]));
        const missing = tags.filter(name => !tagIds.has(name));
        if (missing.length > 0) {
            const max = await client.query('SELECT COALESCE(MAX(tag_id), 0) AS max_id FROM tags');
            let tagId = Number(max.rows[0].max_id);
            for (const name of missing) {
                tagId += 1;
                await client.query('INSERT INTO tags (tag_id, name) VALUES ($1, $2)', [tagId, name]);
                tagIds.set(name, tagId);
            }
        }
        for (const name of tags) {
            await client.query('INSERT INTO tag_links (object_id, tag_id) VALUES ($1, $2)', [entryId, tagIds.get(name)]);
        }
    }
}
