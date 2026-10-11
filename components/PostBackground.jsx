import styles from './PostBackground.module.scss';
import { getTitleImageUrl, hasMapTitleImage, hasTitleImage } from "@/components/PostTitleImage";
import { useMapImageSrc } from "@/components/maps/MapImage";

// Same image as the homepage background, for posts with no hero of their own.
const DEFAULT_BACKGROUND = '/img/gold-rush-desktop.jpg';

/**
 * Fills the viewport behind a single post with its hero image, or its map when the
 * hero is a GPX track. The layer is fixed, so it doesn't scroll with the page.
 */
export default function PostBackground({ post }) {
    const isMap = hasMapTitleImage(post);
    const mapSrc = useMapImageSrc(isMap ? post.imageFileName : null);

    if (isMap && mapSrc === undefined) {
        return null; // Still looking up the map; don't flash the default first.
    }
    const heroSrc = isMap ? mapSrc : (hasTitleImage(post) ? getTitleImageUrl(post) : null);
    const src = heroSrc || DEFAULT_BACKGROUND;
    return (
        <div className={styles.background} style={{ backgroundImage: `url(${src})` }}
             data-testid="post-background" aria-hidden="true"/>
    );
}
