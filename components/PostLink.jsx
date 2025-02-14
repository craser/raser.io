import Link from "next/link";
import { getPostLink } from "@/lib/util/Links";

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
