import { useRouter } from "next/router";
import SinglePostPage from "@/components/pages/SinglePostPage"
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PostIdParamPage() {
    const router = useRouter();
    const postId = !router.query.postId;
    console.log(`PostIdParamPage: postId ${postId} (fallback? ${router.isFallback})`);
    if (postId) {
        return <LoadingSpinner />
    } else {
        return <SinglePostPage postId={router.query.postId}/>;
    }
}


