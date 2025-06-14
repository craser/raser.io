import { PostLink } from "@/components/PostLink";
import styles from './Post.module.scss';
import { CircleArrowLeft, CircleArrowRight} from 'lucide-react'

export default function NextPrevPostLinks({ nextPost, prevPost }) {
    return (
        <div className={styles.nextPrevLinksContainer}>
            <h1><PostLink className={styles.nextLink} post={nextPost}><CircleArrowLeft className={styles.nextPrevIcon} /></PostLink></h1>
            <h1><PostLink className={styles.prevLink} post={prevPost}><CircleArrowRight className={styles.nextPrevIcon} /></PostLink></h1>
        </div>
    );
}
