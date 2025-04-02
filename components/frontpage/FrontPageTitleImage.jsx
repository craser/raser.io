import PostTitleImage, { hasMapTitleImage, hasTitleImage } from "@/components/PostTitleImage";
import YouTubeTitleImage, { hasYouTubeEmbed } from "@/components/frontpage/YouTubeTitleImage";

export default function FrontPageTitleImage({ post, ...props }) {
    if (hasTitleImage(post) || hasMapTitleImage(post)) {
        return <PostTitleImage post={post} {...props}/>;
    } else if (hasYouTubeEmbed(post)) {
        return <YouTubeTitleImage post={post} {...props}/>;
    }
}
