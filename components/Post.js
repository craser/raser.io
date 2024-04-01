import styles from './Post.module.css';
import { PostLink } from "@/components/PostLink";
import PostMetaInfo from "@/components/PostMetaInfo";
import PostTitleImage from "@/components/PostTitleImage";
import { useEffect, useRef } from "react";

export const Post = ({ post, showBody }) => {
    const topRef = useRef(null); // used to scroll back to the top when post changes

    /* Using this here to scroll back to the top of entries when next/prev
     * buttons are clicked. Next.js wraps the whole page in a <div id="__next">,
     * and all elements scroll within *that*, rather than within the body.
     *
     * I'm not crazy about how this places the scroll position *exactly* at the
     * top of the post, but that's going to have to be a battle for another day.
     */
    useEffect(() => {
        topRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        })
    }, [post]);


    return (
        <div ref={topRef} className={styles.entry}>
            <h2 className={styles.title}><PostLink post={post}>{post.title}</PostLink></h2>
            <PostMetaInfo post={post}/>
            <PostTitleImage post={post}/>
            <div dangerouslySetInnerHTML={{ __html: post.intro }}/>
            {(showBody)
                ? <div dangerouslySetInnerHTML={{ __html: post.body }}/>
                : null
            }
            <div className={styles.entryfooter}>
                • • •
            </div>
        </div>
    )
};
