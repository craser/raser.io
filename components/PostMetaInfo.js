import styles from "@/components/Post.module.css";
import DatePosted from "@/components/DatePosted";
import CommentsLink from "@/components/CommentsLink";
import PostTagsList from "@/components/PostTagsList";
import AuthLoggedIn from "@/components/auth/AuthLoggedIn";
import EditLink from "@/components/EditLink";
import DeleteLink from "@/components/DeleteLink";
import { usePostViewContext } from "@/components/PostViewContext";

export default function PostMetaInfo(props) {
    const { toEditView } = usePostViewContext();
    let { post } = props;
    return (
        <div className={styles.entryMetaInfoContainer}>
            <div className={styles.entrymetainfo}>
                <PostTagsList post={post} className={styles.tagslist}/>
                <DatePosted post={post}/> • <CommentsLink post={post}/>
            </div>
            <AuthLoggedIn>
                <div className={styles.entrymetainfo}>
                    <>(</>
                    <EditLink onClick={toEditView}>edit</EditLink>
                    <> | </>
                    <DeleteLink post={post}>delete</DeleteLink>
                    <>)</>
                </div>
            </AuthLoggedIn>
        </div>
    );
}
