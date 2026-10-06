import styles from './Post.module.scss';
import { PostPreview } from '@/components/PostPreview';
import PageSection from '@/components/frontpage/PageSection';

export default function NextPrevPostLinks({ nextPost, prevPost }) {
    return (
        <div className={styles.nextPrevLinksContainer}>
            {nextPost &&
                <PageSection title="next" className={[styles.nextPrevPreviewContainer, styles.nextLink].join(' ')}>
                    <PostPreview post={nextPost} />
                </PageSection>}
            {prevPost &&
                <PageSection title="previous" className={[styles.nextPrevPreviewContainer, styles.prevLink].join(' ')}>
                    <PostPreview post={prevPost} />
                </PageSection>}
        </div>
    );
}
