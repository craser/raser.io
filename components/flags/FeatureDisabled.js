import { useFeatureEnabled } from "@/components/flags/FeatureFlagProvider";

export default function FeatureDisabled({ feature, children, override }) {
    const flag = useFeatureEnabled(feature);
    const enabled = override !== undefined ? override : flag;
    if (enabled) {
        return null;
    } else {
        return <>{children}</>
    }
}
