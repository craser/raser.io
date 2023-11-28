import { useRouter } from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditPostPage from "@/components/pages/EditPostPage";
import SecurePage from "@/components/auth/SecurePage";

export default function PostIdParamPage(props) {
    const router = useRouter();
    if (!router.query.postId) {
        return <LoadingSpinner/>
    } else {
        return (
            <SecurePage>
                <EditPostPage postId={router.query.postId} />
            </SecurePage>
            );
    }
}
