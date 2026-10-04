// ABOUTME: Turns a validated post folder into the record PostWriter stores.
// ABOUTME: Decides the title image fields, attachment metadata and the CDN form of the HTML.

import { AUTHOR, CDN_BASE_URL } from '@/lib/publish/constants';
import { rewriteLinks } from '@/lib/publish/linkRewriter';

/** blog_entries.image_file_type: 0 renders a map from a .gpx file, 1 an image. */
const MAP_IMAGE_TYPE = 0;
const IMAGE_TYPE = 1;

/**
 * @param folder {{post: Object, intro: string, body: string, files: Array<Object>}} a folder that passed validation
 * @param times {{entryId: (number|null), datePosted: string, lastUpdated: string}}
 */
export function buildPostRecord({ post, intro, body, files }, { entryId, datePosted, lastUpdated }) {
    const filesByPath = new Map(files.map(file => [file.path, file]));
    const metadataByPath = new Map((post.attachments ?? []).map(attachment => [attachment.path, attachment]));
    const titleFile = post.titleImage ? filesByPath.get(post.titleImage) : null;
    const storedBody = rewriteLinks(body, files, CDN_BASE_URL);

    return {
        entryId: entryId ?? null,
        title: post.title.trim(),
        intro: rewriteLinks(intro, files, CDN_BASE_URL),
        body: storedBody.trim() === '' ? null : storedBody,
        datePosted: `${datePosted}:00`,
        lastUpdated,
        imageFileName: titleFile ? titleFile.name : null,
        imageFileType: titleFile ? (titleFile.kind === 'map' ? MAP_IMAGE_TYPE : IMAGE_TYPE) : null,
        viaUrl: post.via?.url ?? null,
        viaTitle: post.via?.title ?? null,
        viaText: post.via?.text ?? null,
        userId: AUTHOR.userId,
        userName: AUTHOR.userName,
        tags: [...new Set((post.tags ?? []).map(tag => tag.trim()))],
        attachments: files.map((file) => {
            const metadata = metadataByPath.get(file.path) ?? {};
            return {
                fileName: file.name,
                fileType: file.kind,
                mimeType: file.mimeType,
                title: metadata.title ?? file.name,
                description: metadata.description ?? null,
                isGallery: metadata.gallery === true
            };
        })
    };
}
