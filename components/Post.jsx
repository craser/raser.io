import styles from './Post.module.scss';
import { PostLink } from "@/components/PostLink";
import PostMetaInfo from "@/components/PostMetaInfo";
import PostTitleImage from "@/components/PostTitleImage";
import PostTitle from "@/components/PostTitle";
import { useEffect, useRef } from "react";

export const Post = ({ post, showBody }) => {
    const topRef = useRef(null);

    // A temporary fix for the problem of YouTube videos being hard-coded to 630px wide.
    useEffect(() => {
        let setPostWidth = () => {
            if (topRef.current) { // FIXME: band-aid to deal with use inside the edit view, where there's no topref.
                topRef.current.style.setProperty('--post-width', topRef.current.offsetWidth);
                topRef.current.querySelectorAll('iframe[title="YouTube video player"]').forEach((iframe) => {
                    const height = iframe.offsetHeight;
                    iframe.style.setProperty('--iframe-height', `${height}px`);
                });
            }
        };
        setPostWidth();
        window.addEventListener('resize', setPostWidth);
    });


    return (
        <div ref={topRef} className={styles.entry}>
            <PostLink post={post}><PostTitle post={post} as="h2" className={styles.title}/></PostLink>
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
