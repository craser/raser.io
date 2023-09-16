import FrontPageLayout from "@/components/templates/FrontPageLayout";
import TrailHeadMap from "@/components/maps/TrailHeadMap";
import MapPageLayout from "@/components/templates/MapPageLayout";

export default function TrailMapsPage(props) {
    return (
        <MapPageLayout
            content={<TrailHeadMap />}
        />
    );
}
