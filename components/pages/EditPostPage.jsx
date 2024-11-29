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
import EditPostView from "@/components/EditPostView";

export default function EditPostPage({ postId }) {
    const router = useRouter();
    const { getAuthToken } = useAuthenticationContext();
    const [postDao, setPostDao] = useState(PostDao.getCachingPostDao());
    const [post, setPost] = useState(null);

    useEffect(() => {
        logger.debug(`Fetching entry for ${postId}`);
        postDao.getPostById(postId)
            .then(post => setPost(post))
            .catch((e) => {
                logger.error(e);
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
