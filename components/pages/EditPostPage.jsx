import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { getPostLink } from "@/components/PostLink";
import EditPostView from "@/components/EditPostView";

export default function EditPostPage({ postId }) {
    const dataContext = useDataContext();
    const apostDao = dataContext.getPostDao();
    const router = useRouter();
    const [post, setPost] = useState(null);

    useEffect(() => {
        console.debug(`Fetching entry for ${postId}`);
        postDao.getPostById(postId)
            .then(post => setPost(post))
            .catch((e) => {
                console.error(e);
                setPost(null)
            });

    }, [postId, postDao]);

    const onPostSave = (post) => {
        let url = getPostLink(post);
        router.push(url);
    };

    if (!post) {
        return (
            <LoadingSpinner/>
        );
    } else {
        return (
            <EditPostView post={post} onPostSave={onPostSave} />
        );
    }
}
