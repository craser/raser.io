// ABOUTME: Shows one post, optionally with links to the posts before and after it.
// ABOUTME: A page where the post is the main content asks for its title image to be preloaded.

import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";

export default function ReadPostView({ post, showBody, next, prev, showNextPrev, preloadTitleImage }) {
    return <>
        <Post post={post} showBody={showBody} preloadTitleImage={preloadTitleImage}/>
        {showNextPrev &&
            <NextPrevPostLinks nextPost={next} prevPost={prev}/>
        }
    </>;
}
