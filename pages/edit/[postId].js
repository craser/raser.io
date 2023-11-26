import { useRouter } from "next/router";
import SinglePostPage from "@/components/pages/SinglePostPage"
import LoadingSpinner from "@/components/LoadingSpinner";
import EditPostPage from "@/components/pages/EditPostPage";
import { useCallback, useEffect, useState } from "react";
import PostDao from "@/model/PostDao";

export default function PostIdParamPage(props) {
    const router = useRouter();
    const [postDao, setPostDao] = useState(new PostDao());
    const [post, setPost] = useState(null);
    const savePost = (post) => {
        console.log(`saving post`, post); // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
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
