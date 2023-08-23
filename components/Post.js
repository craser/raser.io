import styles from './Post.module.css';
import {PostLink} from "@/components/PostLink";

export const Post = (props) => {
    let post = props.post;
    return (
        <div className={styles.entry}>
            <h2><PostLink post={post}>{post.title}</PostLink></h2>
            <p className="text-xl text-center">{post.intro}</p>
            <p className="text-xl text-center">{post.body}</p>
        </div>
    )
}
