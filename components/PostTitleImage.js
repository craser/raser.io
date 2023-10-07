import styles from "@/components/Post.module.css"

export default function PostTitleImage(props) {
    let post = props.post;

    if (post.imageFileName) {
        // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
        // TODO: somehow soft-code this url
        let src = `http://localhost:8081/attachments/postcards/${post.imageFileName}`;
        return <img className="titleimage" src={src} />;
    } else {
        return null;
    }
}
