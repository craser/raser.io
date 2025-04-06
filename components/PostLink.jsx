import Link from "next/link";
import { getPostLink } from "@/lib/util/Links";

/**
 * Maps a Post object to canonical URL.
 * Enables automatic prefetching of post pages for faster navigation.
 *
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export const PostLink = ({ post, children, prefetch = true, ...props }) => {
    if (!post) {
        return <span>{children}</span>
    } else {
        return (
            <Link 
                href={getPostLink(post)} 
                prefetch={prefetch}
                {...props}
            >
                {children}
            </Link>
        )
    }
};
