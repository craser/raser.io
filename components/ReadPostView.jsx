// ABOUTME: Shows one post, optionally with links to the posts before and after it.
// ABOUTME: A page where the post is the main content asks for its title image to be fetched first.

import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";

export default function ReadPostView({ post, showBody, next, prev, showNextPrev, prioritizeTitleImage }) {
    return <>
        <Post post={post} showBody={showBody} prioritizeTitleImage={prioritizeTitleImage}/>
        {showNextPrev &&
            <NextPrevPostLinks nextPost={next} prevPost={prev}/>
        }
    </>;
}
