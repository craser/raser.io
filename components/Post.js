import styles from './Post.module.css';
import { PostLink } from "@/components/PostLink";
import PostMetaInfo from "@/components/PostMetaInfo";
import PostTitleImage from "@/components/PostTitleImage";

export const Post = ({ post, showBody }) => {
     return (
        <div className={styles.entry}>
            <h2 className={styles.title}><PostLink post={post}>{post.title}</PostLink></h2>
            <PostMetaInfo post={post}/>
            <PostTitleImage post={post}/>
            <div dangerouslySetInnerHTML={{ __html: post.intro }}/>
            {(showBody)
                ? <div dangerouslySetInnerHTML={{ __html: post.body }}/>
                : null
            }
            <div className={styles.entryfooter}>
                • • •
            </div>
        </div>
    )
};
