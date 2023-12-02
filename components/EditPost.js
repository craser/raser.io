import styles from './Post.module.css';
import PostTitleImage from "@/components/PostTitleImage";
import EditTitleImage from "@/components/EditTitleImage";
import { useState } from "react";

export const EditPost = ({ post, savePost }) => {

    const [titleImage, setTitleImage] = useState(null);

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
        savePost(post, titleImage);
    }

    function onTitleImageDrop(file) {
        // FIXME: DO NOT COMMIT TO CODE REPOSITORY! VERY ROUGH CODE!
        console.log({ file });
        post.imageFileName = file.name;
        post.imageFileType = 1; // image
        setTitleImage(file);
    }

    console.log('rendering...');
    return (
        <div className={styles.entry}>
            <h2 className={styles.title}><textarea onChange={onTitleChange} type="text" rows={1} cols={60} defaultValue={post.title}/></h2>
            <EditTitleImage post={post} setTitleImage={onTitleImageDrop} />
            <div>
                <textarea onChange={onIntroChange} rows={10} cols={60} defaultValue={post.intro} />
            </div>
            <div>
                <textarea onChange={onBodyChange} rows={10} cols={60} defaultValue={post.body} />
            </div>
            <div className={styles.entryfooter}>
                <button onClick={onSaveClicked}>publish</button>
            </div>
        </div>
    )
};
