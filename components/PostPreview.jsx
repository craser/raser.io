import styles from '@/components/PostPreview.module.scss';
import { PostLink } from '@/components/PostLink';
import PostTitle from '@/components/PostTitle';
import { PostedDate } from '@/components/frontpage/PostedDate';
import { EstimatedMinutesToRead } from '@/components/frontpage/EstimatedMinutesToRead';
import PreviewTitleImage from '@/components/frontpage/PreviewTitleImage';

export function PostPreview({ post, ...props }) {
    if (!post) return null;
    return (
        <div className={styles.post} data-testid="postPreview">
            <PostLink post={post}>
                <PreviewTitleImage post={post} className={styles.image} />
                <PostTitle post={post} className={styles.title} {...props} />
                <div className={styles.footer}>
                    <div className={styles.date}><PostedDate post={post} /> • <EstimatedMinutesToRead post={post} />
                    </div>
                </div>
            </PostLink>
        </div>
    );
}
