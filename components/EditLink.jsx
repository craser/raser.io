import Link from "next/link";

/**
 * Maps a Post object to canonical URL.
 *
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
export default function EditLink({ post, onClick, children }) {
    if (post) {
        return (
            <Link href={'/edit/' + post.entryId}>{children}</Link>
        );
    } else {
        function clickWrap(e) {
            e.preventDefault();
            onClick(e);
        }
        return (
            <a onClick={clickWrap}>{children}</a>
        );
    }
};
