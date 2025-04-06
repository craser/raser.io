import { useFeatureEnabled } from "@/components/flags/FeatureFlagProvider";

export default function FeatureEnabled({ feature, children, override }) {
    let flag = useFeatureEnabled(feature);
    let enabled = override !== undefined ? override : flag;
    if (enabled) {
        return <>{children}</>
    } else {
        return null;
    }
}
