import Link from "next/link"
import { useDataContext } from "@/components/api/DataProvider";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PostedDate } from "@/components/frontpage/PostedDate";
import { EstimatedMinutesToRead } from "@/components/frontpage/EstimatedMinutesToRead";
import FrontPageTitleImage from "@/components/frontpage/FrontPageTitleImage";
import { PostBriefIntro } from "@/components/frontpage/PostBriefIntro";
import styles from './LatestPost.module.scss';
import PageSection from "@/components/frontpage/PageSection";
import { PostLink } from "@/components/PostLink";

export default function LatestPostSection() {
    const postDao = useDataContext().getPostDao();

    const [post, setPost] = useState(null);

    useEffect(() => {
        postDao.getLatestPost().then(setPost);
    }, []);

    if (!post) {
        return (
            <LoadingSpinner/>
        );
    } else {

        return (
            <PageSection title="Latest" hero={true}>
                <PostLink post={post}>
                    <div className={styles.latestPost}>
                        {/* Background image */}
                        <div className={styles.titleImageContainer}>
                            <FrontPageTitleImage post={post} className={styles.titleImage}/>
                        </div>

                        {/* Content overlay positioned on the right */}
                        <div className={styles.postInfo}>
                            <h3 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 hover:underline ${styles.postTitle}`}>
                                {post.title}
                            </h3>
                            <PostBriefIntro post={post} className="text-sm md:text-base mb-6"/>
                            <div className={styles.byLine}>
                                <img className={styles.bylineIcon} src="/img/chris-social-avatar.png" alt="Chris Raser"/>
                                <div>
                                    <p className="text-sm font-medium">Chris Raser</p>
                                    <p className="text-white/70 text-xs">
                                        <PostedDate post={post}/> • <EstimatedMinutesToRead post={post}/></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PostLink>
            </PageSection>
        )
    }
}

