import {PostLink} from "@/components/PostLink";

export default function CommentsLink(props) {
    let { post } = props;
    let numComments = post.comments ? post.comments.length : 0;
    return (
        <PostLink post={post}>comments ({numComments})</PostLink>
    );
}
