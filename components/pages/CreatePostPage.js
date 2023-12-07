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
    const { getAuthToken, getEmail } = useAuthenticationContext();
    const [postDao, setPostDao] = useState(new PostDao());
    const [post, setPost] = useState(null);

    const savePost = (post, titleImage) => {
        console.info({ msg: 'publishing post', post })
        let email = getEmail();
        let authToken = getAuthToken();
        postDao.publishPost(post, )
        postDao.updatePost(post, authToken)
            .then(post => postDao.setTitleImage(post, titleImage, authToken))
            .then(post => setPost(post));
    };

    useEffect(() => {
        console.debug(`Fetching fresh entry`);
        let email = getEmail();
        let authToken = getAuthToken();
        postDao.createPost(email, authToken)
            .then(post => setPost(post))
            .catch(e => {
                console.error(e);
                setPost(null);
            });
    }, []);

    if (!post) {
        return (
            <FrontPageLayout content={
                <LoadingSpinner/>
            }/>
        );
    } else {
        return (
            <FrontPageLayout content={
                <EditPost post={post} savePost={savePost}/>
            }/>
        );
    }
}
