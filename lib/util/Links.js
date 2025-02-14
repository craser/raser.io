export function getPostLink(post) {
    return `/archive/${post.entryId}`
}

export function getDownloadLink(fileName) {
    return `/d/${fileName}`;
}
