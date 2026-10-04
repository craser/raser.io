// ABOUTME: Runs a publish: validate the folder, plan uploads, confirm, upload, write the post, record the result.
// ABOUTME: Each step finishes before the next starts, so a failure never leaves the database pointing at missing files.

import fs from 'node:fs';
import { readPostFolder, writeBack } from '@/lib/publish/PostFolder';
import { buildPostRecord } from '@/lib/publish/postRecord';
import { planUploads } from '@/lib/publish/PublishPlanner';
import PublishError from '@/lib/publish/PublishError';
import { formatLocalMinute, formatLocalSecond } from '@/lib/publish/timestamps';
import { validatePostFolder } from '@/lib/publish/validate';

export default class Publisher {
    #cdn;
    #writer;
    #confirm;
    #log;
    #now;

    /**
     * @param cdn {{list: Function, upload: Function}} a CdnStore
     * @param writer {{findEntry: Function, nextEntryId: Function, write: Function}} a PostWriter
     * @param confirm {function(string): Promise<boolean>} asks the user a yes/no question
     * @param log {function(string)} prints a line of progress
     * @param now {function(): Date}
     */
    constructor({ cdn, writer, confirm, log, now = () => new Date() }) {
        this.#cdn = cdn;
        this.#writer = writer;
        this.#confirm = confirm;
        this.#log = log;
        this.#now = now;
    }

    async publish(dir, { dryRun = false, force = false, yes = false } = {}) {
        const folder = readPostFolder(dir);
        const errors = validatePostFolder(folder);
        if (errors.length > 0) {
            throw new PublishError(`${dir} has problems:`, errors);
        }
        const { post } = folder;

        const existing = post.entryId != null ? await this.#writer.findEntry(post.entryId) : null;
        if (post.entryId != null && !existing) {
            throw new PublishError(
                `post.json says entryId ${post.entryId}, but there is no such entry. Refusing to create a duplicate; `
                + 'fix entryId, or set it to null to publish as a new post.'
            );
        }

        const nextEntryId = post.entryId == null ? await this.#writer.nextEntryId() : null;

        const plan = planUploads({
            files: folder.files,
            listing: await this.#cdn.list(),
            ownedNames: existing ? existing.attachmentNames : new Set(),
            force
        });
        if (plan.collision.length > 0) {
            throw new PublishError(
                'These files differ from same-named files already on the CDN that are not recorded as this post\'s '
                + '(they may belong to another post, or be left from a failed earlier run). Rename them, or pass --force to overwrite:',
                plan.collision.map(file => `${file.path} → ${file.name}`)
            );
        }

        const now = this.#now();
        const datePosted = post.datePosted ?? formatLocalMinute(now);
        const record = buildPostRecord(folder, { entryId: post.entryId ?? null, datePosted, lastUpdated: formatLocalSecond(now) });
        this.#log(describePlan(record, plan, nextEntryId));

        if (dryRun) {
            return { status: 'dry-run', plan };
        }
        const action = record.entryId == null ? 'new entry' : `update entry ${record.entryId}`;
        if (!yes && !(await this.#confirm(`Publish "${record.title}" (${action}) with ${folder.files.length} files to raser.io?`))) {
            return { status: 'cancelled', plan };
        }

        for (const file of plan.upload) {
            this.#log(`uploading ${file.name}`);
            await this.#cdn.upload(file.name, fs.readFileSync(file.absolutePath), file.mimeType);
        }
        const entryId = await this.#writer.write(record);
        try {
            writeBack(dir, { entryId, datePosted });
        } catch (error) {
            throw new PublishError(
                `Published as entry ${entryId}, but could not update post.json (${error.message}). `
                + `Set "entryId": ${entryId} and "datePosted": "${datePosted}" in post.json by hand, or the next run will create a duplicate.`
            );
        }
        return { status: 'published', entryId, plan };
    }
}

/**
 * The summary shown before confirming, and the whole output of a dry run.
 */
export function describePlan(record, plan, nextEntryId = null) {
    const forced = new Set(plan.forced.map(file => file.name));
    const heading = record.entryId == null ? `New entry (will be ${nextEntryId})` : `Update entry ${record.entryId}`;
    return [
        `${heading}: "${record.title}", dated ${record.datePosted}`,
        ...plan.upload.map(file => `  upload: ${file.name}${forced.has(file.name) ? ' (overwrites existing file, --force)' : ''}`),
        ...plan.skip.map(file => `  unchanged: ${file.name}`),
        ...(record.tags.length > 0 ? [`  tags: ${record.tags.join(', ')}`] : [])
    ].join('\n');
}
