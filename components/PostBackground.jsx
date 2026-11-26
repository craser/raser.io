// ABOUTME: The fixed, dimmed layer behind a single post: its hero photo or map, else the homepage's image.
// ABOUTME: It's resized to the screen and fetched at low priority, so it never slows the post's own images.

import Image from "next/image";
import styles from './PostBackground.module.scss';
import { getTitleImageUrl, hasMapTitleImage, hasTitleImage } from "@/components/PostTitleImage";
import { useMapImageSrc } from "@/components/maps/MapImage";
import { isOptimizable } from "@/lib/images/OptimizedImageHost";

// Same image as the homepage background, for posts with no hero of their own.
const DEFAULT_BACKGROUND = '/img/gold-rush-desktop.jpg';

/**
 * Fills the viewport behind a single post with its hero image, or its map when the
 * hero is a GPX track. The layer is fixed, so it doesn't scroll with the page.
 *
 * The image is lazy and low-priority: it shares the hero's photo, and fetching the
 * full-size original first would hold up the post's title image.
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
        <div className={styles.background} data-testid="post-background" aria-hidden="true">
            <Image className={styles.image} src={src} alt="" fill sizes="100vw" fetchPriority="low"
                   unoptimized={!isOptimizable(src)}/>
        </div>
    );
}
