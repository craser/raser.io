import styles from "@/components/Post.module.css"
import getConfig from "@/lib/RaserIoConfig";


export function getTitleImageUrl(post) {
    let config = getConfig();
    const postcards = `${config.api.root}${config.api.endpoints.postcards}`;
    const src = `${postcards}/${post.imageFileName}`;
    return src;
}

export default function PostTitleImage({ post, className }) {
    if (post.imageFileName && post.imageFileType === 'image') {
        let src = getTitleImageUrl(post);
        return <img src={src} className={className || 'titleimage'} />;
    } else {
        return null;
    }
}
