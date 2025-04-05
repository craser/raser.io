import { Fragment, useEffect, useState } from "react";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import StandardLayout from "@/components/templates/StandardLayout";
import PostViewContext from "@/components/PostViewContext";
import { useDataContext } from "@/components/api/DataProvider";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

export default function SinglePostPage({ postId, initialPost = null, initialNext = null, initialPrev = null }) {
    const analytics = useAnalytics();
    const dataContext = useDataContext();
    const [post, setPost] = useState(initialPost);
    const [next, setNext] = useState(initialNext);
    const [prev, setPrev] = useState(initialPrev);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            analytics.firePageView(postId);
            analytics.fireReferrer(document.referrer, { post: postId });
        }
    }, [postId, analytics]);

    useEffect(() => {
        // Skip fetching if we already have data from props
        if (initialPost && initialPost.entryId === postId) {
            return;
        }

        console.debug(`Fetching entry for ${postId}`);
        const postDao = dataContext.getPostDao();
        postDao.getPostById(postId)
            .then(post => {
                setPost(post);
                return post;
            })
            .then(post => {
                // Skip fetching next/prev if we already have them
                if (!initialNext) {
                    postDao.getNextPost(post)
                        .then(setNext);
                }
                if (!initialPrev) {
                    postDao.getPrevPost(post)
                        .then(setPrev);
                }
            })
            .catch((e) => {
                console.error(e);
                setPost(null)
            });

    }, [postId, initialPost, initialNext, initialPrev, dataContext]);

    if (!post) {
        return (
            <StandardLayout content={<LoadingSpinner/>}/>
        );
    } else {
        return (
            <StandardLayout content={
                <PostViewContext post={post} showBody={true} next={next} prev={prev}/>
            }/>
        );
    }
}
