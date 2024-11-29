import { SiteConfig } from "@/lib/SiteConfig";
import { useAnalytics } from "@/components/analytics/AnalyticsContext";


export function getTitleImageUrl(post) {
    const src = new SiteConfig().getValue('images.postcard', post);
    return src;
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
        analytics.fireEvent(`image load failed. src: "${src}"`);
    }

    if (/\.gpx$/.test(post.imageFileName)) {
        return null;
    } else if (post.imageFileName && post.imageFileType === 'image') {
        let src = getTitleImageUrl(post);
        return <img src={src} className={className || 'titleimage'} onError={() => notifyAnalytics(src)} />;
    } else {
        return null;
    }
}
