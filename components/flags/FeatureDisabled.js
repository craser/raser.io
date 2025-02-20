import { useFeatureEnabled } from "@/components/flags/FeatureFlagProvider";

export default function FeatureDisabled({ feature, children }) {
    const enabled = useFeatureEnabled(feature);
    if (enabled) {
        return null;
    } else {
        return <>{children}</>
    }
}
