import { useFeatureEnabled } from "@/components/flags/FeatureFlagProvider";

export default function FeatureEnabled({ feature, children }) {
    let enabled = useFeatureEnabled(feature);
    if (enabled) {
        return <>{children}</>
    } else {
        return null;
    }
}
