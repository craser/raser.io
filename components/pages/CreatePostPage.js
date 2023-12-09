import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import { EditPost } from "@/components/EditPost";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function CreatePostPage() {
    const { getAuthToken, getEmail, isLoggedIn } = useAuthenticationContext();
    const [postDao, setPostDao] = useState(new PostDao());
    const [post, setPost] = useState(null);

    const savePost = (post, attachments) => {
        console.info({ msg: 'publishing post', post })
        let authToken = getAuthToken();
        postDao.publishPost(post, authToken)
            .then(post => {
                if (titleImage) {
                    return postDao.setTitleImage(post, titleImage, authToken);
                } else {
                    return post;
                }
            })
            .then(post => setPost(post));
    };

    useEffect(() => {
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
    }, [isLoggedIn]);

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
