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
        // Create the PostDao instance
        const postDao = PostDao.getPostDao();
        const config = new SiteConfig();

        // Check if landing page feature is enabled
        const isLandingPageEnabled = config.featureFlags?.showLandingFrontpage ?? true;

        // Fetch the latest post
        const latestPost = await postDao.getLatestPost();

        // Fetch recent posts for previous posts section (skip the first one which is the latest)
        const allRecentPosts = await postDao.getEntries(0, 6);
        const recentPosts = allRecentPosts.slice(1);

        // Fetch entries for the standard layout
        const entries = await postDao.getEntries(0, 30);

        return {
            props: {
                latestPost,
                recentPosts,
                entries,
                isLandingPageEnabled
            },
            // Revalidate every hour (3600 seconds)
            revalidate: 3600
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
