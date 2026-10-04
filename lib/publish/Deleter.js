// ABOUTME: Runs a delete: find the entry, refuse if it has comments, confirm, delete it, reset post.json, purge files.
// ABOUTME: CDN files are only removed with purgeFiles, after the database delete commits, and never while another entry uses them.

import { readPostFolder, writeBack } from '@/lib/publish/PostFolder';
import PublishError from '@/lib/publish/PublishError';

export default class Deleter {
    #cdn;
    #writer;
    #confirm;
    #log;

    /**
     * @param cdn {{delete: Function}} a CdnStore
     * @param writer {{findEntryForDeletion: Function, sharedFileNames: Function, deleteEntry: Function}} a PostWriter
     * @param confirm {function(string): Promise<boolean>} asks the user a yes/no question
     * @param log {function(string)} prints a line of progress
     */
    constructor({ cdn, writer, confirm, log }) {
        this.#cdn = cdn;
        this.#writer = writer;
        this.#confirm = confirm;
        this.#log = log;
    }

    /**
     * @param target {{entryId: number}|{dir: string}} the entry, or the post folder that published it
     */
    async delete(target, { dryRun = false, yes = false, purgeFiles = false } = {}) {
        const entryId = target.dir ? entryIdFromFolder(target.dir) : target.entryId;

        const entry = await this.#writer.findEntryForDeletion(entryId);
        if (!entry) {
            throw new PublishError(`There is no entry ${entryId}; nothing to delete.`);
        }
        if (entry.commentCount > 0) {
            throw new PublishError(`Entry ${entryId} has ${entry.commentCount} comments; not deleting it.`);
        }

        const shared = purgeFiles ? await this.#writer.sharedFileNames(entryId, entry.fileNames) : new Set();
        const purge = purgeFiles ? entry.fileNames.filter(name => !shared.has(name)) : [];
        this.#log(describeDeletion(entry, { purgeFiles, purge, shared }));

        if (dryRun) {
            return { status: 'dry-run' };
        }
        if (!yes && !(await this.#confirm(`Delete entry ${entryId} "${entry.title}"?`))) {
            return { status: 'cancelled' };
        }

        await this.#writer.deleteEntry(entryId);
        if (target.dir) {
            try {
                writeBack(target.dir, { entryId: null, datePosted: null });
            } catch (error) {
                throw new PublishError(
                    `Deleted entry ${entryId}, but could not reset post.json (${error.message}). `
                    + 'Set "entryId" and "datePosted" to null by hand before publishing this folder again.'
                );
            }
        }

        const failures = [];
        for (const name of purge) {
            try {
                await this.#cdn.delete(name);
            } catch (error) {
                failures.push(`${name}: ${error.message}`);
            }
        }
        if (failures.length > 0) {
            throw new PublishError(`Deleted entry ${entryId}, but these CDN files could not be deleted:`, failures);
        }
        return { status: 'deleted', entryId, purged: purge };
    }
}

function entryIdFromFolder(dir) {
    const { post } = readPostFolder(dir);
    if (!Number.isInteger(post.entryId)) {
        throw new PublishError(`${dir}/post.json has no entryId, so it has not been published; nothing to delete.`);
    }
    return post.entryId;
}

/**
 * The summary shown before confirming, and the whole output of a dry run.
 */
function describeDeletion(entry, { purgeFiles, purge, shared }) {
    const lines = [`Delete entry ${entry.entryId}: "${entry.title}", dated ${entry.datePosted}`];
    if (!purgeFiles) {
        lines.push('  CDN files stay in place (pass --purge-files to delete them)');
    } else {
        lines.push(...purge.map(name => `  delete from CDN: ${name}`));
        lines.push(...entry.fileNames.filter(name => shared.has(name)).map(name => `  keep on CDN (another entry uses it): ${name}`));
    }
    return lines.join('\n');
}
