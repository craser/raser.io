import FrontLandingLayout from "@/components/templates/FrontLandingLayout";
import LatestPost from "@/components/frontpage/LatestPost";
import StandardLayout from "@/components/templates/StandardLayout";
import LogEntries from "@/components/LogEntries";
import GithubActivity from "@/components/github/GithubActivity";
import SocialFeed from "@/components/frontpage/SocialFeed";
import PreviousPosts from "@/components/frontpage/PreviousPosts";
import FeatureEnabled from "@/components/flags/FeatureEnabled";
import FeatureDisabled from "@/components/flags/FeatureDisabled";
import PostDao from '@/model/PostDao';
import SiteConfig from '@/lib/SiteConfig';

export default function Home({ latestPost, recentPosts, entries, isLandingPageEnabled }) {
    return (
        <>
            <FeatureEnabled feature='showLandingFrontpage' override={isLandingPageEnabled}>
                <FrontLandingLayout
                    latest={<LatestPost initialPost={latestPost} />}
                    github={<GithubActivity/>}
                    social={<SocialFeed/>}
                    previous={<PreviousPosts initialPosts={recentPosts} />}
                />
            </FeatureEnabled>
            <FeatureDisabled feature='showLandingFrontpage' override={isLandingPageEnabled}>
                <StandardLayout
                    content={<LogEntries initialEntries={entries} initialPage={0} pageSize={30}/>}
                />
            </FeatureDisabled>
        </>
    )
}

export async function getStaticProps() {
    try {
        const config = new SiteConfig();
        const entriesCount = config.getValue('staticGeneration.prerender.archiveEntries') || 30;
        const recentPostsCount = 6; // Keep this small for the homepage
        const revalidateSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds') || 3600;

        // FIXME: This will always return true on pre-render
        const isLandingPageEnabled = config.featureFlags?.showLandingFrontpage ?? true;
        const postDao = PostDao.getCachingPostDao();
        const entries = await postDao.getEntries(0, entriesCount);
        const recentPosts = entries.slice(1, recentPostsCount);
        const latestPost = entries[0]; // I may live to regret this.

        return {
            props: {
                latestPost,
                recentPosts,
                entries,
                isLandingPageEnabled
            },
            revalidate: revalidateSeconds
        };
    } catch (error) {
        console.error('Error fetching initial data:', error);
        return {
            props: {
                latestPost: null,
                recentPosts: [],
                entries: [],
                isLandingPageEnabled: true
            }
        };
    }
}
