// ABOUTME: Renders a blog post title as a heading that un-scrambles once when it
// ABOUTME: first scrolls into view. The real title is exposed via aria-label.

import ScrambleText from "@/components/search/ScrambleText";

export default function PostTitle({ post, as: As = 'h1', className, ...props }) {
    const title = post.title || '';
    return (
        <As data-testid="post-title" aria-label={title} className={className} {...props}>
            <ScrambleText text={title} duration={800} trigger="visible" />
        </As>
    );
}
