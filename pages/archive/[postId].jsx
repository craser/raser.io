import { useRouter } from "next/router";
import SinglePostPage from "@/components/pages/SinglePostPage"
import LoadingSpinner from "@/components/LoadingSpinner";
import PostDao from '@/model/PostDao';
import SiteConfig from '@/lib/SiteConfig';

export default function PostIdParamPage(props) {
    const router = useRouter();

    // If we have props from getStaticProps, use those directly
    if (props.post) {
        return <SinglePostPage
                postId={props.post.entryId}
                initialPost={props.post}
                initialNext={props.next}
                initialPrev={props.prev} />;
    }

    // Fallback for client-side navigation or if props aren't available
    if (!router.query.postId) {
        return <LoadingSpinner />
    } else {
        return <SinglePostPage postId={router.query.postId}/>;
    }
}

