// ABOUTME: The home page, statically generated with ISR: the newest posts are read from the
// ABOUTME: database at build time and re-read in the background once the revalidate interval passes.

import FrontLandingLayout from "@/components/templates/FrontLandingLayout";
import LatestPost from "@/components/frontpage/LatestPost";
import GithubActivity from "@/components/github/GithubActivity";
import RecentTracks from "@/components/spotify/RecentTracks";
import PreviousPosts from "@/components/frontpage/PreviousPosts";
import FeatureEnabled from "@/components/flags/FeatureEnabled";
import PostRepository from "@/lib/data/PostRepository";
import SiteConfig from "@/lib/SiteConfig";

/** The latest post, plus the five shown under "Previously". */
const FRONT_PAGE_POSTS = 6;

export default function Home({ latestPost, recentPosts }) {
    return (
        <FrontLandingLayout
            latest={<LatestPost initialPost={latestPost} />}
            github={<GithubActivity/>}
            listening={
                <FeatureEnabled feature='showRecentTracks'>
                    <RecentTracks/>
                </FeatureEnabled>
            }
            previous={<PreviousPosts initialPosts={recentPosts} />}
        />
    );
}

/**
 * Errors are left to propagate: during revalidation Next.js then keeps serving the
 * last good page rather than caching an empty one.
 */
export async function getStaticProps() {
    const entries = await PostRepository.getInstance().getEntries(0, FRONT_PAGE_POSTS);
    return {
        props: {
            latestPost: entries[0] ?? null,
            recentPosts: entries.slice(1)
        },
        revalidate: new SiteConfig().getValue('staticGeneration.prerender.revalidateSeconds')
    };
}
