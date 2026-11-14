// ABOUTME: Renders one post, handed in already loaded from the server, with its next/prev neighbours.
// ABOUTME: The neighbours are looked up in the browser through the caching post DAO.

import { Fragment, useEffect, useState } from "react";
import PostDao from '/model/PostDao';
import { Post } from "@/components/Post";
import NextPrevPostLinks from "@/components/NextPrevPostLinks";
import StandardLayout from "@/components/templates/StandardLayout";
import ReadPostView from "@/components/ReadPostView";
import { useDataContext } from "@/components/api/DataProvider";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import SingleSectionContent from '@/components/templates/SingleSectionContent';
import PostBackground from "@/components/PostBackground";

export default function SinglePostPage({ post }) {
    const analytics = useAnalytics();
    const postDao = useDataContext().getPostDao();
    const [next, setNext] = useState(null);
    const [prev, setPrev] = useState(null);
    const postId = String(post.entryId);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            analytics.firePageView(postId);
            analytics.fireReferrer(document.referrer, { post: postId });
        }
    }, [postId, analytics]);

    useEffect(() => {
        // A slower lookup for the previous post must not overwrite this post's neighbours.
        let current = true;
        setNext(null);
        setPrev(null);
        postDao.getNextPost(post).then(next => current && setNext(next));
        postDao.getPrevPost(post).then(prev => current && setPrev(prev));
        return () => {
            current = false;
        };
    }, [post, postDao]);

    return (
        <>
            <PostBackground post={post}/>
            <StandardLayout content={
                <SingleSectionContent content={
                    <ReadPostView post={post} showBody={true} next={next} prev={prev} showNextPrev={true}/>
                }/>
            }/>
        </>
    );
}
