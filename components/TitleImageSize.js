// ABOUTME: The fixed box every post title image (photo, map or YouTube thumbnail) is drawn in.
// ABOUTME: A known size lets the browser reserve the space before the image loads, so the page doesn't shift.

import styles from './TitleImageSize.module.scss';

// Title images come in many shapes (from about 1:1 to 2.6:1), so they're cropped to fill one
// 3:2 box rather than sized from their own dimensions, which the site doesn't store.
export const TITLE_IMAGE_WIDTH = 1500;
export const TITLE_IMAGE_HEIGHT = 1000;

/**
 * The width, height and class to spread onto a title image's <img>, keeping any class the caller passed.
 */
export function titleImageSizeProps(className) {
    return {
        width: TITLE_IMAGE_WIDTH,
        height: TITLE_IMAGE_HEIGHT,
        className: [className, styles.sized].filter(Boolean).join(' '),
    };
}
