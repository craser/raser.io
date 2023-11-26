import { Fragment, useEffect, useState } from "react";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function SinglePostPage({ postId }) {
    const [postDao, setPostDao] = useState(new PostDao());
    const [post, setPost] = useState(null);
    const [next, setNext] = useState(null);
    const [prev, setPrev] = useState(null);

    useEffect(() => {
        console.debug(`Fetching entry for ${postId}`);
        postDao.getPostById(postId)
            .then(post => setPost(post))
            .then(post => {
                postDao.getNextPost(post)
                    .then(setNext);
                postDao.getPrevPost(post)
                    .then(setPrev);
            })
            .catch((e) => {
                console.error(e);
                setPost(null)
            });

    }, [postId]);

    if (!post) {
        return (
            <FrontPageLayout content={<LoadingSpinner/>}/>
        );
    } else {
        return (
            <FrontPageLayout content={
                <Fragment>
                    <Post post={post}/>
                    <NextPrevPostLinks nextPost={nextPost} prevPost={prevPost}/>
                </Fragment>
            }/>
        );
    }
}
