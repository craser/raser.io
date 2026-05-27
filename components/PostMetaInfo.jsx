import styles from "@/components/Post.module.scss";
import DatePosted from "@/components/DatePosted";
import CommentsLink from "@/components/CommentsLink";
import PostTagsList from "@/components/PostTagsList";
import AuthLoggedIn from "@/components/auth/AuthLoggedIn";
import EditLink from "@/components/EditLink";
import { usePostViewContext } from "@/components/PostViewContext";
import FeatureEnabled from '@/components/flags/FeatureEnabled';

export default function PostMetaInfo(props) {
    const { toEditView } = usePostViewContext();
    
    let { post } = props;
    return (
        <div className={styles.entryMetaInfoContainer}>
            <div className={styles.entrymetainfo}>
                <PostTagsList post={post} className={styles.tagslist}/>
                <DatePosted post={post}/>
                <FeatureEnabled feature="postCommentCount"> • <CommentsLink post={post}/></FeatureEnabled>
            </div>
            <AuthLoggedIn>
                <div className={styles.entrymetainfo}>
                    <>(</>
                    <EditLink onClick={toEditView}>edit</EditLink>
                    <>)</>
                </div>
            </AuthLoggedIn>
        </div>
    );
}
