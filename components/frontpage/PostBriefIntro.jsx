import styles from './PostBriefIntro.module.scss';
import { extractTextFromHtml } from "@/lib/search/TextProcessing";

export function PostBriefIntro({ post, maxLength = 40, className, ...props}) {
    const text = extractTextFromHtml(post.intro);
    const words = text.split(/\s+/).slice(0, maxLength).join(' ');
    const fullClassName = [styles.brief, className].join(' ');
    return <p className={fullClassName} {...props}>
        {words}
    </p>;
}
