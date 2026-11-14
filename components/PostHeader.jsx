import styles from '@/components/frontpage/PreviousPosts.module.scss';
import { PostLink } from '@/components/PostLink';
import PreviewTitleImage from '@/components/frontpage/PreviewTitleImage';
import PostTitle from '@/components/PostTitle';
import { PostBriefIntro } from '@/components/frontpage/PostBriefIntro';
import { PostedDate } from '@/components/frontpage/PostedDate';
import { EstimatedMinutesToRead } from '@/components/frontpage/EstimatedMinutesToRead';
import { ChevronRight } from 'lucide-react';

export function PostHeader({ post, ...props }) {
    return (
        <div className={styles.post}>
            <PostLink post={post}>
                <PreviewTitleImage className={styles.image} post={post} />
                <PostTitle post={post} className={styles.title} {...props} />
                <PostBriefIntro className={styles.brief} post={post} maxLength={20} />
                <div className={styles.footer}>
                    <div className={styles.date}><PostedDate post={post} /> • <EstimatedMinutesToRead post={post} />
                    </div>
                    <div className={styles.link}><span>continue</span> <ChevronRight className={styles.continueIcon} />
                    </div>
                </div>
            </PostLink>
        </div>
    );
}
