import Link from "next/link";

export function getPostLink(post) {
    return `/archive/${post.entryId}`
}

/**
 * Maps a Post object to canonical URL.
 *
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export const PostLink = ({ post, children }) => {
    if (!post) {
        return <span>{children}</span>
    } else {
        return <Link href={getPostLink(post)}>{children}</Link>
    }
};
