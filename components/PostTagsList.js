import TagLink from "@/components/TagLink";

export default function PostTagsList(props) {
    let { post, className } = props;
    let { tags } = post;
    tags = ['ranger', 'danger']; // FIXME: DO NOT COMMIT TO CODE REPOSITORY!

    if (tags && tags.length) {
        return (
            <ul className={className}>
                {tags.map(tag =>
                    <li key={`${post.Entry_ID}.${tag}`}><TagLink tag={tag}/></li>
                )}
            </ul>
        );
    } else {
        return null;
    }
}
