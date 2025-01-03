import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";

export default function ReadPostView({ post, showBody, next, prev, showNextPrev }) {
    return <>
        <Post post={post} showBody={showBody}/>
        {showNextPrev &&
            <NextPrevPostLinks nextPost={next} prevPost={prev}/>
        }
    </>;
}
