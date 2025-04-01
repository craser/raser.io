import { useRouter } from "next/router";
import SinglePostPage from "@/components/pages/SinglePostPage"
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PostIdParamPage(props) {
    const router = useRouter();
    if (!router.query.postId) {
        return <LoadingSpinner />
    } else {
        return <SinglePostPage postId={router.query.postId}/>;
    }
}
