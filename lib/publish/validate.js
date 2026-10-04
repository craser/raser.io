// ABOUTME: Checks a post folder for every problem that can be found without the network.
// ABOUTME: Returns all problems at once so one run shows everything to fix.

import { findFolderReferences } from '@/lib/publish/linkRewriter';

const DATE_POSTED = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const VIA_FIELDS = ['url', 'title', 'text'];

/**
 * @param folder {{post: Object, intro: (string|null), body: string, files: Array<{path: string, name: string}>}}
 * @returns {Array<string>} problems; empty when the folder can be published
 */
export function validatePostFolder({ post, intro, body, files }) {
    const paths = new Set(files.map(file => file.path));
    return [
        ...checkPost(post, paths),
        ...checkAttachments(post.attachments, paths),
        ...(intro === null ? ['intro.html is missing.'] : []),
        ...checkUniqueNames(files),
        ...checkReferences('intro.html', intro, paths),
        ...checkReferences('body.html', body, paths)
    ];
}

/** True for "YYYY-MM-DD HH:MM" naming a moment that exists, so "2026-02-30 10:00" and "10:60" fail. */
function isRealDateTime(value) {
    if (typeof value !== 'string' || !DATE_POSTED.test(value)) {
        return false;
    }
    const [year, month, day, hour, minute] = value.split(/[- :]/).map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
        && date.getHours() === hour && date.getMinutes() === minute;
}

function checkPost(post, paths) {
    const errors = [];
    if (typeof post.title !== 'string' || post.title.trim() === '') {
        errors.push('post.json: "title" must be a non-empty string.');
    }
    if (post.datePosted != null && !isRealDateTime(post.datePosted)) {
        errors.push('post.json: "datePosted" must be null or "YYYY-MM-DD HH:MM".');
    }
    if (post.entryId != null && !(Number.isInteger(post.entryId) && post.entryId > 0)) {
        errors.push('post.json: "entryId" must be null or a positive integer; the tool writes it after the first publish.');
    }
    if (post.titleImage != null && !(paths.has(post.titleImage) && post.titleImage.startsWith('images/'))) {
        errors.push(`post.json: "titleImage" ${JSON.stringify(post.titleImage)} must be a file in images/.`);
    }
    if (post.via != null) {
        if (typeof post.via !== 'object' || Array.isArray(post.via)) {
            errors.push('post.json: "via" must be an object.');
        } else {
            for (const field of VIA_FIELDS) {
                if (post.via[field] != null && typeof post.via[field] !== 'string') {
                    errors.push(`post.json: "via.${field}" must be a string or null.`);
                }
            }
        }
    }
    if (post.tags != null && !(Array.isArray(post.tags) && post.tags.every(tag => typeof tag === 'string' && tag.trim() !== ''))) {
        errors.push('post.json: "tags" must be an array of non-empty strings.');
    }
    return errors;
}

function checkAttachments(attachments, paths) {
    if (attachments == null) {
        return [];
    }
    if (!Array.isArray(attachments)) {
        return ['post.json: "attachments" must be an array.'];
    }
    const errors = [];
    const seen = new Set();
    attachments.forEach((attachment, index) => {
        const label = `post.json: attachments[${index}]`;
        if (attachment === null || typeof attachment !== 'object' || typeof attachment.path !== 'string') {
            errors.push(`${label} needs a "path" naming a file in images/ or docs/.`);
        } else if (!paths.has(attachment.path)) {
            errors.push(`${label} ${JSON.stringify(attachment.path)} is not a file in images/ or docs/.`);
        } else if (seen.has(attachment.path)) {
            errors.push(`${label} ${JSON.stringify(attachment.path)} is listed twice.`);
        } else {
            seen.add(attachment.path);
        }
    });
    return errors;
}

/** Files upload to the CDN under their name alone, so two files may not share one. */
function checkUniqueNames(files) {
    const pathsByName = new Map();
    for (const file of files) {
        pathsByName.set(file.name, [...(pathsByName.get(file.name) ?? []), file.path]);
    }
    return [...pathsByName.entries()]
        .filter(([, filePaths]) => filePaths.length > 1)
        .map(([name, filePaths]) => `"${name}" appears more than once (${filePaths.join(', ')}); files upload by name alone, so names must be unique.`);
}

function checkReferences(label, html, paths) {
    return findFolderReferences(html)
        .filter(reference => !paths.has(reference))
        .map(reference => `${label}: "${reference}" is not a file in the folder.`);
}
