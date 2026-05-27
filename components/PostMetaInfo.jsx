import styles from "@/components/Post.module.scss";
import DatePosted from "@/components/DatePosted";
import CommentsLink from "@/components/CommentsLink";
import PostTagsList from "@/components/PostTagsList";
import FeatureEnabled from '@/components/flags/FeatureEnabled';

export default function PostMetaInfo(props) {
    let { post } = props;
    return (
        <div className={styles.entryMetaInfoContainer}>
            <div className={styles.entrymetainfo}>
                <PostTagsList post={post} className={styles.tagslist}/>
                <DatePosted post={post}/>
                <FeatureEnabled feature="postCommentCount"> • <CommentsLink post={post}/></FeatureEnabled>
            </div>
        </div>
    );
}
