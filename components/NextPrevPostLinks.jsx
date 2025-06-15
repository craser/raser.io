import { PostLink } from "@/components/PostLink";
import styles from './Post.module.scss';
import { CircleArrowLeft, CircleArrowRight } from 'lucide-react'
import { PostPreview } from '@/components/PostPreview';
import PageSection from '@/components/frontpage/PageSection';

export default function NextPrevPostLinks({ nextPost, prevPost }) {
    return (
        <>
            <div className={styles.nextPrevLinksContainer}>
                <PageSection title="next" className={styles.nextPrevPreviewContainer}>
                    <PostPreview post={prevPost} />
                </PageSection>
                <PageSection title="previous" className={styles.nextPrevPreviewContainer}>
                    <PostPreview post={nextPost} />
                </PageSection>
            </div>
        </>
    );
}
