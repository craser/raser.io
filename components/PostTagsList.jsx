export default function PostTagsList(props) {
    let { post, className } = props;
    let tags = (post && post.tags && post.tags.length)
        ? post.tags
        : [];

    // Plain text for now: the site has no /tags page for these to link to.
    if (tags && tags.length) {
        return (
            <ul className={className}>
                {tags.map(tag =>
                    <li key={`${post.entryId}.${tag}`}>{tag}</li>
                )}
            </ul>
        );
    } else {
        return null;
    }
}
