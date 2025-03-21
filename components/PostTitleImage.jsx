import SiteConfig from "@/lib/SiteConfig";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { MapImage } from "@/components/maps/MapImage";
import Image from "next/image";


export function getTitleImageUrl(post) {
    const src = new SiteConfig().getValue('images.postcard', post);
    return src;
}

export function hasMapTitleImage(post) {
    return /\.gpx$/.test(post.imageFileName);
}

export function hasTitleImage(post) {
    return post.imageFileName && post.imageFileType === 'image';
}

/**
 * Whups! I forgot that I used a file name with '.gpx' extension and a type of 'image' to indicate that a Google map
 * of the GPX data should be rendered as the hero image.
 *
 * Adding a trap here for that. Will fix & render in my copious free time.
 *
 * @param post
 * @param className
 * @returns {JSX.Element|null}
 * @constructor
 */
export default function PostTitleImage({ post, className }) {
    const analytics = useAnalytics();
    const notifyAnalytics = (src) => {
        analytics.fireImgFail(src);
    }

    if (hasMapTitleImage(post)) {
        return (
            <MapImage className={className || 'titleimage'}
                      onError={() => notifyAnalytics(post.imageFileName)} fileName={post.imageFileName}
            />
        );
    } else if (hasTitleImage(post)) {
        let src = getTitleImageUrl(post);
        return (
            <img src={src} className={className || 'titleimage'}
                     onError={() => notifyAnalytics(src)}
            />
        );
    } else {
        return null;
    }
}
