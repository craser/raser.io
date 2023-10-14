import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/router";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function SinglePost(props) {
    const router = useRouter();
    const [post, setPost] = useState(null);
    const postDao = new PostDao();

    useEffect(() => {
        console.debug(`Fetching entry for ${(router.query.postId)}`);
        postDao.getPostById(router.query.postId)
            .then(post => setPost(post))
            .catch((e) => {
                console.error(e);
                setPost(null)
            });

    }, [router.query.postId]);

    function nextPost() {
        postDao.getNextPost(post.entryId)
            .then(next => next && setPost(next));
    }

    function prevPost() {
        postDao.getPrevPost(post.entryId)
            .then(prev => prev && setPost(prev));
    }

    if (!router.query.postId || !post) {
        return (
            <FrontPageLayout content={<LoadingSpinner/>}/>
        );
    } else {
        return (
            <FrontPageLayout content={
                <Fragment>
                    <Post post={post}/>
                    <NextPrevPostLinks post={post} nextPost={nextPost} prevPost={prevPost}/>
                </Fragment>
            }/>
        );
    }
}
