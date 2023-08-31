import styles from "@/components/Post.module.css";
import DatePosted from "@/components/DatePosted";
import CommentsLink from "@/components/CommentsLink";
import PostTagsList from "@/components/PostTagsList";

export default function PostMetaInfo(props) {
    let { post } = props;
    return (
        <div className={styles.entrymetainfo}>
            <PostTagsList post={post} className={styles.tagslist}/>
            <DatePosted post={post}/> • <CommentsLink post={post}/>
        </div>
    );
}
