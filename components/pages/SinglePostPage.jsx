import { Fragment, useEffect, useState } from "react";
import PostDao from '/model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import PostViewContext from "@/components/PostViewContext";
import { useDataContext } from "@/components/api/DataProvider";
import { useAnalytics } from "@/components/analytics/AnalyticsContext";

export default function SinglePostPage({ postId }) {
    const analytics = useAnalytics();
    const dataContext = useDataContext();
    const [post, setPost] = useState(null);
    const [next, setNext] = useState(null);
    const [prev, setPrev] = useState(null);

    useEffect(() => {
        analytics.firePageView(postId);
        analytics.fireReferrer(document.referrer, { post: postId });
    }, [postId])

    useEffect(() => {
        console.debug(`Fetching entry for ${postId}`);
        const postDao = dataContext.getPostDao();
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
                <PostViewContext post={post} showBody={true} next={next} prev={prev}/>
            }/>
        );
    }
}
