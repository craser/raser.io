import styles from './PostBackground.module.scss';
import { getTitleImageUrl, hasMapTitleImage, hasTitleImage } from "@/components/PostTitleImage";
import { useMapImageSrc } from "@/components/maps/MapImage";

/**
 * Fills the viewport behind a single post with its hero image, or its map when the
 * hero is a GPX track. The layer is fixed, so it doesn't scroll with the page.
 */
export default function PostBackground({ post }) {
    const isMap = hasMapTitleImage(post);
    const mapSrc = useMapImageSrc(isMap ? post.imageFileName : null);
    const src = isMap ? mapSrc : (hasTitleImage(post) ? getTitleImageUrl(post) : null);

    if (!src) {
        return null;
    }
    return (
        <div className={styles.background} style={{ backgroundImage: `url(${src})` }}
             data-testid="post-background" aria-hidden="true"/>
    );
}
