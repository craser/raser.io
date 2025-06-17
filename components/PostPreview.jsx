import styles from '@/components/PostPreview.module.scss';
import { PostLink } from '@/components/PostLink';
import { PostedDate } from '@/components/frontpage/PostedDate';
import { EstimatedMinutesToRead } from '@/components/frontpage/EstimatedMinutesToRead';
import PreviewTitleImage from '@/components/frontpage/PreviewTitleImage';

export function PostPreview({ post, ...props }) {
    if (!post) return;
    return (
        <div className={styles.post}>
            <PostLink post={post}>
                <PreviewTitleImage post={post} className={styles.image} />
                <h1 className={styles.title} {...props}>{post.title}</h1>
                <div className={styles.footer}>
                    <div className={styles.date}><PostedDate post={post} /> • <EstimatedMinutesToRead post={post} />
                    </div>
                </div>
            </PostLink>
        </div>
    );
}
