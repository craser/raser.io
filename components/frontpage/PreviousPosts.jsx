import PageSection from "@/components/frontpage/PageSection";
import { Heart } from 'lucide-react';
import { useDataContext } from "@/components/api/DataProvider";
import { useState, useEffect } from 'react';
import LoadingSpinner from "@/components/LoadingSpinner";
import styles from './PreviousPosts.module.scss';
import DatePosted from "@/components/DatePosted";
import { PostBriefIntro } from "@/components/frontpage/PostBriefIntro";
import { PostLink } from "@/components/PostLink";
import { FileImage, ChevronRight } from 'lucide-react';
import PostTitleImage from "@/components/PostTitleImage";
import { PostedDate } from "@/components/frontpage/PostedDate";
import { EstimatedMinutesToRead } from "@/components/frontpage/EstimatedMinutesToRead";
import ArchiveLink from "@/components/ArchiveLink";

export default function SocialFeed() {
    const postDao = useDataContext().getPostDao();
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        postDao.getEntries(0, 5)
            .then(posts => posts.slice(1)) // the first is, presumably, already in the hero section
            .then(posts => setPosts(posts));
    }, []);


    return (
        <PageSection title="Previously" BgIcon={FileImage}>
            {(posts.length == 0) && <LoadingSpinner/>}
            {(posts.length > 0) &&
                <>
                    <div class={styles.prevPosts}>
                        <PostHeaders posts={posts}/>
                    </div>
                    <ArchiveLink className={styles.archiveLink}>more <ChevronRight /></ArchiveLink>
                </>
            }
        </PageSection>
    );
}

function PostHeaders({ posts }) {
    return (
        <>
            {posts.map(p => <PostHeader key={`${p.entryId}`} post={p}/>)}
        </>
    );
}

function PostHeader({ post, ...props }) {
    return (
        <div className={styles.post}>
            <PostLink post={post}>

                <PostTitleImage className={styles.image} post={post}/>
                <h1 className={styles.title} {...props}>{post.title}</h1>
                <PostBriefIntro className={styles.brief} post={post} maxLength={20}/>
                <div className={styles.footer}>
                    <div className={styles.date}><PostedDate post={post}/> • <EstimatedMinutesToRead post={post}/></div>
                    <div className={styles.link}><span>continue</span> <ChevronRight className={styles.continueIcon}/></div>
                </div>
            </PostLink>
        </div>
    );
}
