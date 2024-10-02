import styles from './Post.module.css';
import { PostLink } from "@/components/PostLink";
import PostMetaInfo from "@/components/PostMetaInfo";
import PostTitleImage from "@/components/PostTitleImage";
import { useEffect, useRef } from "react";

export const Post = ({ post, showBody }) => {
    const topRef = useRef(null);

    useEffect(() => {
        //setPostWidth();
        window.addEventListener('resize', () => {
            topRef.current.style.setProperty('--post-width', topRef.current.offsetWidth);
        });
    });


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
