import { Fragment, useEffect, useState } from "react";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import PostViewContext from "@/components/PostViewContext";

export default function SinglePostPage({ postId }) {
    const [postDao, setPostDao] = useState(PostDao.getCachingPostDao());
    const [post, setPost] = useState(null);
    const [next, setNext] = useState(null);
    const [prev, setPrev] = useState(null);

    useEffect(() => {
        logger.debug(`Fetching entry for ${postId}`);
        postDao.getPostById(postId)
            .then(post => {
                setPost(post);
                return post;
            })
            .then(post => {
                postDao.getNextPost(post)
                    .then(setNext);
                postDao.getPrevPost(post)
                    .then(setPrev);
            })
            .catch((e) => {
                logger.error(e);
                setPost(null)
            });

    }, [postId, postDao]);

    if (!post) {
        return (
            <FrontPageLayout content={<LoadingSpinner/>}/>
        );
    } else {
        return (
            <FrontPageLayout content={
                <PostViewContext post={post} next={next} prev={prev} />
            }/>
        );
    }
}
