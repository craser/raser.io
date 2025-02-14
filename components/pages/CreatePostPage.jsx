import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";
import { EditPost } from "@/components/EditPost";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { useDataContext } from "@/components/api/DataProvider";
import { getPostLink } from "@/lib/util/Links";

export default function CreatePostPage() {
    const dataContext = useDataContext();
    const postDao = dataContext.getPostDao();
    const router = useRouter();
    const { getAuthToken, getEmail, isAuthenticated } = useAuthenticationContext();
    const [post, setPost] = useState(null);

    const savePost = (post, attachments) => {
        console.info({ msg: 'publishing post', post })
        let authToken = getAuthToken();
        postDao.publishPost(post, attachments, authToken)
            .then(getPostLink)
            .then(url => router.push(url));
    };

    useEffect(() => {
        if (isAuthenticated) {
            console.debug(`Fetching fresh entry`);
            let email = getEmail();
            let authToken = getAuthToken();
            postDao.createPost(email, authToken)
                .then(post => {
                    setPost(post)
                })
                .catch(e => {
                    console.error(e);
                    setPost(null);
                });
        }
    }, [isAuthenticated, postDao]);

    if (!post) {
        return (
            <LoadingSpinner/>
        );
    } else {
        return (
            <EditPost post={post} savePost={savePost}/>
        );
    }
}
