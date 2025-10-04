import PageSection from "@/components/frontpage/PageSection";
import { ChevronRight, FileImage } from 'lucide-react';
import { useDataContext } from "@/components/api/DataProvider";
import { useEffect, useState } from 'react';
import LoadingSpinner from "@/components/LoadingSpinner";
import styles from './PreviousPosts.module.scss';
import ArchiveLink from "@/components/ArchiveLink";
import { PostHeader } from '@/components/PostHeader';

export default function PreviousPosts({ initialPosts = null }) {
    const postDao = useDataContext().getPostDao();
    const [posts, setPosts] = useState(initialPosts || []);

    // Log initial posts count on component mount
    useEffect(() => {
        const initialCount = initialPosts ? initialPosts.length : 0;
        console.log(`[PreviousPosts] Component rendered with ${initialCount} initial posts`);
    }, []);

    useEffect(() => {
        if (!initialPosts) {
            console.log('[PreviousPosts] Fetching posts from client side');
            postDao.getEntries(0, 5)
                .then(posts => posts.slice(1)) // the first is, presumably, already in the hero section
                .then(posts => {
                    console.log(`[PreviousPosts] Successfully fetched ${posts.length} posts`);
                    setPosts(posts);
                })
                .catch(error => {
                    console.error('[PreviousPosts] Error fetching posts:', error);
                });
        }
    }, [initialPosts, postDao]);

    return (
        <PageSection title="Previously" BgIcon={FileImage}>
            {(posts.length == 0) && <LoadingSpinner/>}
            {(posts.length > 0) &&
                <>
                    <div className={styles.prevPosts}>
                        <PostHeaders posts={posts}/>
                    </div>
                    <ArchiveLink className={styles.archiveLink} prefetch={true}>
                        more <ChevronRight />
                    </ArchiveLink>
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

