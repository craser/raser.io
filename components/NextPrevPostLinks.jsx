import { PostLink } from "@/components/PostLink";
import styles from './Post.module.scss';

export default function NextPrevPostLinks({ nextPost, prevPost }) {
    return (
        <div className={styles.nextPrevLinksContainer}>
            <h1><PostLink className={styles.nextLink} post={nextPost}>NEXT</PostLink></h1>
            <h1><PostLink className={styles.prevLink} post={prevPost}>PREV</PostLink></h1>
        </div>
    );
}
