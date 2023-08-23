import Link from "next/link";

/**
 * Maps a Post object to canonical URL.
 *
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export const PostLink = (props) => {
    return (
        <Link href={'posts/' + props.post.id}>{props.children}</Link>
    );
};
