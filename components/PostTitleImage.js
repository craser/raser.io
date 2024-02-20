import { RaserIoConfig } from "@/lib/RaserIoConfig";


export function getTitleImageUrl(post) {
    const src = new RaserIoConfig().getEndpoint('postcards', post);
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
