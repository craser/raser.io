import PostTitleImage, { hasMapTitleImage, hasTitleImage, getTitleImageUrl } from "@/components/PostTitleImage";
import YouTubeTitleImage, { hasYouTubeEmbed, getYouTubeTitleImageUrl } from "@/components/frontpage/YouTubeTitleImage";

export function getFrontPageTitleImageUrl(post) {
    if (hasTitleImage(post) || hasMapTitleImage(post)) {
        return getTitleImageUrl(post);
    } else if (hasYouTubeEmbed(post)) {
        return getYouTubeTitleImageUrl(post);
    } else {
        return null;
    }
}


export default function FrontPageTitleImage({ post, ...props }) {
    if (hasTitleImage(post) || hasMapTitleImage(post)) {
        return <PostTitleImage post={post} {...props}/>;
    } else if (hasYouTubeEmbed(post)) {
        return <YouTubeTitleImage post={post} {...props}/>;
    }
}
