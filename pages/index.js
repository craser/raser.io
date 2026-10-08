import FrontLandingLayout from "@/components/templates/FrontLandingLayout";
import LatestPost from "@/components/frontpage/LatestPost";
import StandardLayout from "@/components/templates/StandardLayout";
import LogEntries from "@/components/LogEntries";
import GithubActivity from "@/components/github/GithubActivity";
import RecentTracks from "@/components/spotify/RecentTracks";
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
                    listening={
                        <FeatureEnabled feature='showRecentTracks'>
                            <RecentTracks/>
                        </FeatureEnabled>
                    }
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
