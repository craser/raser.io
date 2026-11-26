// ABOUTME: A post title image drawn in the fixed 3:2 box, resized by Next's image optimizer when it's on our CDN.
// ABOUTME: `sizes` says how wide it's drawn, so a small preview downloads a small file instead of the original.

import Image from 'next/image';
import { titleImageSizeProps } from '@/components/TitleImageSize';
import { isOptimizable } from '@/lib/images/OptimizedImageHost';

// Both match the `small` breakpoint in styles/mixins.scss, below which images span the screen.
/** A title image at the top of a post, in a column about 600px wide. */
export const POST_SIZES = '(max-width: 760px) 100vw, 600px';
/** A post preview card on the home page or under a post; roughly a quarter of the page wide. */
export const PREVIEW_SIZES = '(max-width: 760px) 100vw, 30vw';

export default function TitleImage({ src, className, sizes = POST_SIZES, alt = '', ...props }) {
    return (
        <Image src={src} alt={alt} sizes={sizes} unoptimized={!isOptimizable(src)}
               {...props} {...titleImageSizeProps(className)}/>
    );
}
