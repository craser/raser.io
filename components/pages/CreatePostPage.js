import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import { EditPost } from "@/components/EditPost";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { getPostLink } from "@/components/PostLink";

export default function CreatePostPage() {
    const router = useRouter();
    const { getAuthToken, getEmail, isAuthenticated } = useAuthenticationContext();
    const [postDao, setPostDao] = useState(PostDao.getPostDao());
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
    }, [isAuthenticated]);

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
