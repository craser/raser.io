import { useDataContext } from "@/components/api/DataProvider";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PostedDate } from "@/components/frontpage/PostedDate";
import { EstimatedMinutesToRead } from "@/components/frontpage/EstimatedMinutesToRead";
import { PostBriefIntro } from "@/components/frontpage/PostBriefIntro";
import styles from './LatestPost.module.scss';
import { PostLink } from "@/components/PostLink";
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
            <LoadingSpinner/>
        );
    } else {
        // TODO: get rid of this tailwind styling garbage - worked great for initial rough-in, but annoying.
        return (
            <PostLink post={post} className={styles.latestPostLink}>
                <div className={styles.latestPost} style={{ '--hero-image': `url(${getFrontPageTitleImageUrl(post)})` }}>
                    <div className={styles.postInfo}>
                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 hover:underline">
                            {post.title}
                        </h3>
                        <PostBriefIntro maxLength={60} post={post} className="text-sm md:text-base mb-6"/>
                        <div className={styles.byLine}>
                            <img className={styles.bylineIcon} src="/img/chris-social-avatar.png" alt="Chris Raser"/>
                            <div>
                                <p className="text-sm font-medium">Chris Raser</p>
                                <p className={`text-xs ${styles.meta}`}>
                                    <PostedDate post={post}/> • <EstimatedMinutesToRead post={post}/></p>
                            </div>
                        </div>
                    </div>
                </div>
            </PostLink>
        )
    }
}

