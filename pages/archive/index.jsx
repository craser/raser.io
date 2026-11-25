// ABOUTME: The archive index, statically generated with ISR: the first page of posts is read from the database
// ABOUTME: when the page is generated, and LogEntries loads further pages in the browser as the reader scrolls.

import LogEntries from '../../components/LogEntries';
import StandardLayout from "../../components/templates/StandardLayout";
import SingleSectionContent from '@/components/templates/SingleSectionContent';
import PostRepository from "@/lib/data/PostRepository";
import SiteConfig from "@/lib/SiteConfig";

export default function Home({ initialEntries }) {
    const pageSize = new SiteConfig().getValue('staticGeneration.prerender.archiveEntries');
    // The first page arrives prerendered, so LogEntries carries on from the second.
    return (
        <StandardLayout content={
            <SingleSectionContent content={
                <LogEntries initialEntries={initialEntries} initialPage={1} pageSize={pageSize}/>
            }/>
        } />
    )
}

/**
 * Errors are left to propagate: during revalidation Next.js then keeps serving the
 * last good page rather than caching an empty one.
 */
export async function getStaticProps() {
    const config = new SiteConfig();
    const pageSize = config.getValue('staticGeneration.prerender.archiveEntries');
    const initialEntries = await PostRepository.getInstance().getEntries(0, pageSize);
    return {
        props: { initialEntries },
        revalidate: config.getValue('staticGeneration.prerender.revalidateSeconds')
    };
}
