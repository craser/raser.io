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
        <Link href={'archive/' + props.post.Entry_ID}>{props.children}</Link>
    );
};
