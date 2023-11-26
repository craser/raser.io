import Link from "next/link";

/**
 * Maps a Post object to canonical URL.
 *
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export default function EditLink({ post, children }) {
    return (
        <Link href={'/edit/' + post.entryId}>{children}</Link>
    );
};
