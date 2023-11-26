import { useRouter } from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditPostPage from "@/components/pages/EditPostPage";
import { useEffect, useState } from "react";
import PostDao from "@/model/PostDao";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function PostIdParamPage(props) {
    const { getAuthToken } = useAuthenticationContext();

    const router = useRouter();
    const [postDao, setPostDao] = useState(new PostDao());
    const [post, setPost] = useState(null);

    const savePost = (post) => {
        console.log(`saving post`, post); // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
        postDao.updatePost(post, getAuthToken())
            .then(post => setPost(post));
    };

    useEffect(() => {
        console.debug(`Fetching entry for ${router.query.postId}`);
        postDao.getPostById(router.query.postId)
            .then(post => setPost(post))
            .catch((e) => {
                console.error(e);
                setPost(null)
            });

    }, [router.query.postId]);

    if (!post) {
        return <LoadingSpinner/>
    } else {
        return <EditPostPage
            post={post}
            savePost={savePost}
        />
    }
}
