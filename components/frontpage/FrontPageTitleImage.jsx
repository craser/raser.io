import PostTitleImage, { hasMapTitleImage, hasTitleImage } from "@/components/PostTitleImage";

export default function FrontPageTitleImage({ post, ...props })
{
    if (hasTitleImage(post) || hasMapTitleImage(post)) {
        return <PostTitleImage post={post} className="frontpagetitleimage"/>;
    } else {
        return (
            <img src="https://raserio.b-cdn.net/2020-whiteboard.jpg"
                 onError={() => notifyAnalytics(src)}
                 {...props}
            />
        );
    }
}
