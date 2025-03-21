import FrontLandingLayout from "@/components/templates/FrontLandingLayout";
import LatestPost from "@/components/frontpage/LatestPost";

export default function Home({ initialEntries }) {
    return (
        <FrontLandingLayout
            content={<LatestPost />}
        />
    )
}
