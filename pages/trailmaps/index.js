import StandardLayout from "@/components/templates/StandardLayout";
import TrailHeadMap from "@/components/maps/TrailHeadMap";
import MapPageLayout from "@/components/templates/MapPageLayout";

export default function TrailMapsPage(props) {
    return (
        <MapPageLayout>
            <TrailHeadMap />
        </MapPageLayout>
    );
}
