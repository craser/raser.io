import styles from './Post.module.css';
import {PostLink} from "@/components/PostLink";
import PostMetaInfo from "@/components/PostMetaInfo";

export const Post = (props) => {
    let { post, showBody } = props;
    return (
        <div className={styles.entry}>
            <h2 className={styles.title}><PostLink post={post}>{post.Title}</PostLink></h2>
            <PostMetaInfo post={post} />
            <div dangerouslySetInnerHTML={{ __html: post.Intro }}/>
            {(showBody)
                ? <div dangerouslySetInnerHTML={{__html: post.Body}}/>
                : null
            }
            <div className={styles.entryfooter}>
                • • •
            </div>
        </div>
    )
}
