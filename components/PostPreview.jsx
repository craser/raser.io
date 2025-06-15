import styles from '@/components/PostPreview.module.scss';
import { PostLink } from '@/components/PostLink';
import PostTitleImage from '@/components/PostTitleImage';
import { PostedDate } from '@/components/frontpage/PostedDate';
import { EstimatedMinutesToRead } from '@/components/frontpage/EstimatedMinutesToRead';

export function PostPreview({ post, ...props }) {
    return (
        <div className={styles.post}>
            <PostLink post={post}>
                <PostTitleImage className={styles.image} post={post} />
                <h1 className={styles.title} {...props}>{post.title}</h1>
                <div className={styles.footer}>
                    <div className={styles.date}><PostedDate post={post} /> • <EstimatedMinutesToRead post={post} />
                    </div>
                </div>
            </PostLink>
        </div>
    );
}
