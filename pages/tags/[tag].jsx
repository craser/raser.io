import Head from 'next/head';
import { useRouter } from "next/router";
import LogEntries from '@/components/LogEntries';
import StandardLayout from "@/components/templates/StandardLayout";
import SingleSectionContent from '@/components/templates/SingleSectionContent';
import LoadingSpinner from "@/components/LoadingSpinner";
import styles from './TagPage.module.scss';

/**
 * Lists the posts carrying one tag, newest first, laid out like the archive.
 */
export default function TagPage() {
    const router = useRouter();
    if (!router.isReady) {
        return <LoadingSpinner/>;
    }
    const tag = router.query.tag;
    // Keyed by tag, so following a tag link from this page starts a fresh list.
    return (
        <>
            <Head>
                <title>{`Posts tagged ${tag} - DeathB4Decaf`}</title>
            </Head>
            <StandardLayout content={
                <SingleSectionContent content={
                    <>
                        <h2 className={styles.heading}>Posts tagged <span className={styles.tag}>{tag}</span></h2>
                        <LogEntries key={tag} tag={tag} initialPage={0} pageSize={30}/>
                    </>
                }/>
            } />
        </>
    );
}
