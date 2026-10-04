// ABOUTME: Creates a new post folder from the template, for `npm run blog-post -- --gen <name>`.
// ABOUTME: Never touches a folder that already exists.

import fs from 'node:fs';
import path from 'node:path';
import PublishError from '@/lib/publish/PublishError';

export const POST_TEMPLATE = {
    title: '',
    datePosted: null,
    titleImage: null,
    via: { url: null, title: null, text: null },
    tags: [],
    attachments: [],
    _attachmentExample: {
        path: 'images/hero.jpg',
        title: 'Halls Lake',
        description: 'Optional longer description',
        gallery: false
    },
    entryId: null
};

const INTRO_TEMPLATE = '<p> Intro. Shown on the front page and in the archive.\n</p>\n';
const BODY_TEMPLATE = "<p> Body. Shown only on the post's own page.\n</p>\n";

/** Letters, digits, dot, dash and underscore, not starting with a dot. */
const FOLDER_NAME = /^[\w-][\w.-]*$/;

/**
 * @param postsRoot {string} folder that holds post folders; created if missing
 * @param name {string} name of the new post folder
 * @returns {string} path of the new folder
 */
export function createPostScaffold(postsRoot, name) {
    if (!FOLDER_NAME.test(name)) {
        throw new PublishError(`"${name}" is not a usable folder name. Use letters, digits, ".", "-" and "_".`);
    }
    const dir = path.join(postsRoot, name);
    if (fs.existsSync(dir)) {
        throw new PublishError(`${dir} already exists; not touching it.`);
    }
    fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'docs'));
    fs.writeFileSync(path.join(dir, 'post.json'), `${JSON.stringify(POST_TEMPLATE, null, 2)}\n`);
    fs.writeFileSync(path.join(dir, 'intro.html'), INTRO_TEMPLATE);
    fs.writeFileSync(path.join(dir, 'body.html'), BODY_TEMPLATE);
    return dir;
}
