// ABOUTME: Decides, for each file in a post folder, whether to upload it, skip it, or stop on a collision.
// ABOUTME: Compares local checksums against the CDN listing and the files this post already owns.

/**
 * @param files {Array<{name: string, checksum: string}>}
 * @param listing {Map<string, (string|null)>} CDN file name → checksum
 * @param ownedNames {Set<string>} file names already recorded as this entry's attachments
 * @param force {boolean} overwrite files that belong to other posts
 */
export function planUploads({ files, listing, ownedNames, force }) {
    const plan = { upload: [], skip: [], collision: [], forced: [] };
    for (const file of files) {
        if (!listing.has(file.name)) {
            plan.upload.push(file);
        } else if (listing.get(file.name) === file.checksum) {
            plan.skip.push(file);
        } else if (ownedNames.has(file.name)) {
            plan.upload.push(file);
        } else if (force) {
            plan.upload.push(file);
            plan.forced.push(file);
        } else {
            plan.collision.push(file);
        }
    }
    return plan;
}
