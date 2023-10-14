import styles from "@/components/Post.module.css"
import getConfig from "@/lib/RaserIoConfig";

export default function PostTitleImage(props) {
    let post = props.post;
    const { postcards } = getConfig().api.endpoints;

    if (post.imageFileName && post.imageFileType === 'image') {
        // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
        // TODO: somehow soft-code this url

        let src = `${postcards}/${post.imageFileName}`;
        return <img className="titleimage" src={src} />;
    } else {
        return null;
    }
}
