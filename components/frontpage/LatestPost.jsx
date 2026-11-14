import { useDataContext } from "@/components/api/DataProvider";
import { useEffect, useState } from "react";
import { PostedDate } from "@/components/frontpage/PostedDate";
import { EstimatedMinutesToRead } from "@/components/frontpage/EstimatedMinutesToRead";
import { PostBriefIntro } from "@/components/frontpage/PostBriefIntro";
import styles from './LatestPost.module.scss';
import { PostLink } from "@/components/PostLink";
import PostTitle from "@/components/PostTitle";
import { getFrontPageTitleImageUrl } from "@/components/frontpage/PreviewTitleImage";

export default function LatestPostSection({ initialPost = null }) {
    const postDao = useDataContext().getPostDao();
    const [post, setPost] = useState(initialPost);

    useEffect(() => {
        if (!initialPost) {
            postDao.getLatestPost().then(setPost);
        }
    }, [initialPost, postDao]);

    if (!post) {
        return (
            <LatestPostSkeleton/>
        );
    } else {
        return (
            <PostLink post={post} className={styles.latestPostLink}>
                <div className={styles.latestPost} style={{ '--hero-image': `url(${getFrontPageTitleImageUrl(post)})` }}>
                    <div className={styles.postInfo}>
                        <PostTitle post={post} as="h3" className={styles.postTitle}/>
                        <PostBriefIntro maxLength={60} post={post} className={styles.brief}/>
                        <div className={styles.byLine}>
                            <img className={styles.bylineIcon} src="/img/chris-social-avatar.png" alt="Chris Raser"/>
                            <div>
                                <p className={styles.byLineName}>Chris Raser</p>
                                <p className={styles.byLineMeta}>
                                    <PostedDate post={post}/> • <EstimatedMinutesToRead post={post}/></p>
                            </div>
                        </div>
                    </div>
                </div>
            </PostLink>
        )
    }
}

/**
 * Stand-in for the hero while the post loads. It uses the same .latestPost and
 * .postInfo boxes as the real thing, so the splash area holds its size and
 * nothing below it jumps when the post arrives.
 */
function LatestPostSkeleton() {
    return (
        <div className={`${styles.latestPost} ${styles.skeleton}`} data-testid="latest-post-skeleton"
             aria-busy="true" aria-label="Loading latest post">
            <div className={styles.postInfo} aria-hidden="true">
                <div className={`${styles.bone} ${styles.boneTitle}`}/>
                <div className={`${styles.bone} ${styles.boneTitle} ${styles.boneShort}`}/>
                <div className={`${styles.bone} ${styles.boneText}`}/>
                <div className={`${styles.bone} ${styles.boneText} ${styles.boneShort}`}/>
                <div className={styles.byLine}>
                    <div className={`${styles.bone} ${styles.boneAvatar}`}/>
                    <div className={styles.boneByLineText}>
                        <div className={`${styles.bone} ${styles.boneMeta}`}/>
                        <div className={`${styles.bone} ${styles.boneMeta} ${styles.boneShort}`}/>
                    </div>
                </div>
            </div>
        </div>
    );
}
