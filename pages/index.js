import FrontLandingLayout from "@/components/templates/FrontLandingLayout";
import LatestPost from "@/components/frontpage/LatestPost";
import StandardLayout from "@/components/templates/StandardLayout";
import LogEntries from "@/components/LogEntries";
import GithubActivity from "@/components/github/GithubActivity";
import { SocialFeed } from "@/components/frontpage/SocialFeed";
import FeatureEnabled from "@/components/flags/FeatureEnabled";
import FeatureDisabled from "@/components/flags/FeatureDisabled";

export default function Home() {
    return (
        <>
            <FeatureEnabled feature='showLandingFrontpage'>
                <FrontLandingLayout
                    latest={<LatestPost/>}
                    github={<GithubActivity/>}
                    social={<SocialFeed/>}
                />
            </FeatureEnabled>
            <FeatureDisabled feature='showLandingFrontpage'>
                <StandardLayout
                    content={<LogEntries initialEntries={null} initialPage={0} pageSize={30}/>}
                />
            </FeatureDisabled>
        </>
    )
}
