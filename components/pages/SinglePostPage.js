import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/router";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function SinglePostPage({ postId }) {
    const [postDao, setPostDao] = useState(new PostDao());
    const [post, setPost] = useState(null);

    useEffect(() => {
        console.debug(`Fetching entry for ${postId}`);
        postDao.getPostById(postId)
            .then(post => setPost(post))
            .catch((e) => {
                console.error(e);
                setPost(null)
            });

    }, [postId]);

    function nextPost() {
        console.debug('SinglePostPage.nextPost');
        postDao.getNextPost(post)
            .then(next => {
                console.log('next post:', next);
                return next;
            })
            .then(next => next && setPost(next));
    }

    function prevPost() {
        postDao.getPrevPost(post.entryId)
            .then(prev => prev && setPost(prev));
    }

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
