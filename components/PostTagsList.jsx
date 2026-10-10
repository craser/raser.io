import Link from "next/link";

export default function PostTagsList(props) {
    let { post, className } = props;
    let tags = (post && post.tags && post.tags.length)
        ? post.tags
        : [];

    if (tags && tags.length) {
        return (
            <ul className={className}>
                {tags.map(tag =>
                    <li key={`${post.entryId}.${tag}`}>
                        <Link href={`/tags/${encodeURIComponent(tag)}`}>{tag}</Link>
                    </li>
                )}
            </ul>
        );
    } else {
        return null;
    }
}
