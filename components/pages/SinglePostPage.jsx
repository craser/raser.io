// ABOUTME: Renders one post, handed in already loaded from the server, with its next/prev neighbours.
// ABOUTME: The neighbours are looked up in the browser through the caching post DAO.

import { Fragment, useEffect, useState } from "react";
import StandardLayout from "@/components/templates/StandardLayout";
import ReadPostView from "@/components/ReadPostView";
import { useDataContext } from "@/components/api/DataProvider";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import SingleSectionContent from '@/components/templates/SingleSectionContent';
import PostBackground from "@/components/PostBackground";

export default function SinglePostPage({ post }) {
    const analytics = useAnalytics();
    const postDao = useDataContext().getPostDao();
    // Each neighbour is stored with the post it was looked up for, so a different post shows
    // no neighbours until its own lookups finish.
    const [nextLookup, setNextLookup] = useState({ post: null, neighbour: null });
    const [prevLookup, setPrevLookup] = useState({ post: null, neighbour: null });
    const next = nextLookup.post === post ? nextLookup.neighbour : null;
    const prev = prevLookup.post === post ? prevLookup.neighbour : null;
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
        postDao.getNextPost(post).then(next => current && setNextLookup({ post, neighbour: next }));
        postDao.getPrevPost(post).then(prev => current && setPrevLookup({ post, neighbour: prev }));
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
