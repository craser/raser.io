import FrontLandingLayout from "@/components/templates/FrontLandingLayout";
import LatestPost from "@/components/frontpage/LatestPost";
import { useFeatureEnabled, useFeatureFlags } from "@/components/flags/FeatureFlagProvider";
import StandardLayout from "@/components/templates/StandardLayout";
import LogEntries from "@/components/LogEntries";

export default function Home() {
    const flags = useFeatureFlags();
    const showNewLandingPage = useFeatureEnabled('showLandingFrontpage')
    const navSearchEnabled = useFeatureEnabled('navSearch');
    console.log(`SANITY CHECK: navSearchEnabled=${navSearchEnabled}`);

    if (showNewLandingPage) {
        return (
            <FrontLandingLayout
                content={<LatestPost/>}
            />
        )
    } else {
        return (
            <StandardLayout
                content={<LogEntries initialEntries={null} initialPage={0} pageSize={30}/>}
            />
        );
    }
}
