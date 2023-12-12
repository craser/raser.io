import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import { EditPost } from "@/components/EditPost";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { getPostLink } from "@/components/PostLink";

export default function EditPostPage({ postId }) {
    const router = useRouter();
    const { getAuthToken } = useAuthenticationContext();
    const [postDao, setPostDao] = useState(new PostDao());
    const [post, setPost] = useState(null);


    const savePost = (post, attachments) => {
        console.info({ msg: 'updating post', post })
        let authToken = getAuthToken();
        postDao.updatePost(post, attachments, authToken)
            .then(getPostLink)
            .then(url => router.push(url));
    };

    useEffect(() => {
        console.debug(`Fetching entry for ${postId}`);
        postDao.getPostById(postId)
            .then(post => setPost(post))
            .catch((e) => {
                console.error(e);
                setPost(null)
            });

    }, [postId]);

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
