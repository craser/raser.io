// ABOUTME: Reads a post folder (post.json, intro.html, body.html, images/, docs/) from disk.
// ABOUTME: Also writes the publish results, entryId and datePosted, back into post.json.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import PublishError from '@/lib/publish/PublishError';

/** Folders whose files are uploaded, and the attachment kind each implies. */
const FILE_FOLDERS = { images: 'image', docs: 'document' };

const MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.gpx': 'application/gpx+xml',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime'
};

const DEFAULT_MIME_TYPE = 'application/octet-stream';

/**
 * @param dir {string} the post folder
 * @returns {{dir: string, post: Object, intro: (string|null), body: string, files: Array<Object>}}
 */
export function readPostFolder(dir) {
    return {
        dir,
        post: readPost(path.join(dir, 'post.json')),
        intro: readOptional(path.join(dir, 'intro.html')),
        body: readOptional(path.join(dir, 'body.html')) ?? '',
        files: listFiles(dir)
    };
}

/**
 * Records the results of a publish. Re-reads the file so keys starting with "_",
 * which readPostFolder drops, survive.
 */
export function writeBack(dir, { entryId, datePosted }) {
    const postPath = path.join(dir, 'post.json');
    const post = JSON.parse(fs.readFileSync(postPath, 'utf-8'));
    post.entryId = entryId;
    post.datePosted = datePosted;
    fs.writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`);
}

/** Upper-case hex, the form Bunny's storage listing reports. */
export function sha256(bytes) {
    return crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function readPost(postPath) {
    if (!fs.existsSync(postPath)) {
        throw new PublishError(`${postPath} not found. Create a post folder with --gen.`);
    }
    let post;
    try {
        post = JSON.parse(fs.readFileSync(postPath, 'utf-8'));
    } catch (error) {
        throw new PublishError(`${postPath} is not valid JSON: ${error.message}`);
    }
    if (post === null || typeof post !== 'object' || Array.isArray(post)) {
        throw new PublishError(`${postPath} must hold a JSON object.`);
    }
    for (const key of Object.keys(post)) {
        if (key.startsWith('_')) {
            delete post[key];
        }
    }
    return post;
}

function readOptional(filePath) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
}

function listFiles(dir) {
    const files = [];
    for (const [folder, kind] of Object.entries(FILE_FOLDERS)) {
        const root = path.join(dir, folder);
        if (!fs.existsSync(root)) {
            continue;
        }
        walk(root, (absolutePath) => {
            const name = path.basename(absolutePath);
            const extension = path.extname(name).toLowerCase();
            files.push({
                path: path.relative(dir, absolutePath).split(path.sep).join('/'),
                name,
                absolutePath,
                kind: extension === '.gpx' ? 'map' : kind,
                mimeType: MIME_TYPES[extension] ?? DEFAULT_MIME_TYPE,
                checksum: sha256(fs.readFileSync(absolutePath))
            });
        });
    }
    return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Visits every regular file below dir, skipping dotfiles and dot-folders such as .DS_Store. */
function walk(dir, visit) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) {
            continue;
        }
        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(absolutePath, visit);
        } else if (entry.isFile()) {
            visit(absolutePath);
        }
    }
}
