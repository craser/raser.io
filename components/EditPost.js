import styles from './Post.module.css';
import PostTitleImage from "@/components/PostTitleImage";

export const EditPost = ({ post, savePost }) => {

    function onTitleChange(e) {
        post.title = e.target.value;
    }

    function onIntroChange(e) {
        post.intro = e.target.value;
    }

    function onBodyChange(e) {
        post.body = e.target.value;
    }

    function onSaveClicked(e) {
        savePost(post);
    }

    console.log('rendering...');
    return (
        <div className={styles.entry}>
            <h2 className={styles.title}><textarea onChange={onTitleChange} type="text" rows={1} cols={60}>{post.title}</textarea></h2>
            <PostTitleImage post={post}/>
            <div>
                <textarea onChange={onIntroChange} rows={10} cols={60}>{post.intro}</textarea>
            </div>
            <div>
                <textarea onChange={onBodyChange} rows={10} cols={60}>{post.body}</textarea>
            </div>
            <div className={styles.entryfooter}>
                <button onClick={onSaveClicked}>publish</button>
            </div>
        </div>
    )
};
