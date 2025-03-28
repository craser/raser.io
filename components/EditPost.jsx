import styles from './Post.module.scss';
import EditTitleImage from "@/components/EditTitleImage";
import { useState } from "react";

export const EditPost = ({ post, savePost, onCancel }) => {

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
        if (titleImage) {
            post.imageFileName = titleImage.name;
            post.imageFileType = 1; // image
        }
        savePost(post, titleImage ? [titleImage] : []);
    }

    function onTitleImageDrop(file) {
        // update the post object on SAVE, not here.
        // We don't actually upload the image until the post is saved.
        post.imageFileName = null; // FIXME: Need a more elegant way to ensure that the EditHeroImage component doesn't try to render this.
        post.imageFileType = null;
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
                <button onClick={onCancel}>cancel</button>
                <button onClick={onSaveClicked}>publish</button>
            </div>
        </div>
    )
};
