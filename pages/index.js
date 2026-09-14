import FrontLandingLayout from "@/components/templates/FrontLandingLayout";
import LatestPost from "@/components/frontpage/LatestPost";
import StandardLayout from "@/components/templates/StandardLayout";
import LogEntries from "@/components/LogEntries";
import GithubActivity from "@/components/github/GithubActivity";
import SocialFeed from "@/components/frontpage/SocialFeed";
import PreviousPosts from "@/components/frontpage/PreviousPosts";
import FeatureEnabled from "@/components/flags/FeatureEnabled";
import FeatureDisabled from "@/components/flags/FeatureDisabled";

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
