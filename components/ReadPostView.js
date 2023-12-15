import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";

export default function ReadPostView({ post, next, prev, showNextPrev }) {
    return <>
        <Post post={post}/>
        {showNextPrev &&
            <NextPrevPostLinks nextPost={next} prevPost={prev}/>
        }
    </>;
}
