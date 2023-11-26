import { PostLink } from "@/components/PostLink";

export default function NextPrevPostLinks({ nextPost, prevPost }) {
    return (
        <div>
            <h1><PostLink post={nextPost}>NEXT</PostLink></h1>
            <h1><PostLink post={prevPost}>PREV</PostLink></h1>
        </div>
    );
}
