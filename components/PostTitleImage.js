import styles from "@/components/Post.module.css"

export default function PostTitleImage(props) {
    let post = props.post;

    if (post.Image_File_Name && (post.Image_File_Type == 'image')) {
        // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
        // TODO: Drop images into an AWS bucket somewhere.
        let src = `http://dreadedmonkeygod.net/home/attachments/postcards/${post.Image_File_Name}`;
        return <img className="titleimage" src={src} />;
    } else {
        return null;
    }
}
