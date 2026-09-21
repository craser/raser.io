import styles from "@/components/Post.module.scss";
import DatePosted from "@/components/DatePosted";
import PostTagsList from "@/components/PostTagsList";

export default function PostMetaInfo(props) {
    let { post } = props;
    return (
        <div data-testid="post-meta-info" className={styles.entryMetaInfoContainer}>
            <div data-testid="post-meta-info-details" className={styles.entrymetainfo}>
                <PostTagsList post={post} className={styles.tagslist}/>
                <DatePosted post={post}/>
            </div>
        </div>
    );
}
