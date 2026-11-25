// ABOUTME: Lists the posts carrying one tag, statically generated with ISR: each tag's first page of posts is
// ABOUTME: read from the database on the tag's first request, and LogEntries loads further pages as the reader scrolls.

import Head from 'next/head';
import LogEntries from '@/components/LogEntries';
import StandardLayout from "@/components/templates/StandardLayout";
import SingleSectionContent from '@/components/templates/SingleSectionContent';
import PostRepository from "@/lib/data/PostRepository";
import SiteConfig from "@/lib/SiteConfig";
import styles from './TagPage.module.scss';

/**
 * Lists the posts carrying one tag, newest first, laid out like the archive.
 */
export default function TagPage({ tag, initialEntries }) {
    const pageSize = new SiteConfig().getValue('staticGeneration.prerender.archiveEntries');
    // Keyed by tag, so following a tag link from this page starts a fresh list. The first page
    // arrives prerendered, so LogEntries carries on from the second.
    return (
        <>
            <Head>
                <title>{`Posts tagged ${tag} - DeathB4Decaf`}</title>
            </Head>
            <StandardLayout content={
                <SingleSectionContent content={
                    <>
                        <h2 className={styles.heading}>Posts tagged <span className={styles.tag}>{tag}</span></h2>
                        <LogEntries key={tag} tag={tag} initialEntries={initialEntries} initialPage={1} pageSize={pageSize}/>
                    </>
                }/>
            } />
        </>
    );
}

/**
 * No tags are prerendered at build time. Each tag is rendered on its first request ('blocking'),
 * so the page never shows a loading state.
 */
export async function getStaticPaths() {
    return {
        paths: [],
        fallback: 'blocking'
    };
}

/**
 * Errors are left to propagate: during revalidation Next.js then keeps serving the
 * last good page rather than caching an empty one.
 */
export async function getStaticProps({ params }) {
    const config = new SiteConfig();
    const pageSize = config.getValue('staticGeneration.prerender.archiveEntries');
    const initialEntries = await PostRepository.getInstance().getEntriesByTag(params.tag, 0, pageSize);
    return {
        props: { tag: params.tag, initialEntries },
        revalidate: config.getValue('staticGeneration.prerender.revalidateSeconds')
    };
}
