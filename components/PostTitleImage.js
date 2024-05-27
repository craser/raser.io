import { SiteConfig } from "@/lib/SiteConfig";


export function getTitleImageUrl(post) {
    const src = new SiteConfig().getValue('images.postcard', post);
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
