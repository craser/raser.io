import { useFlags, withLDProvider } from "launchdarkly-react-client-sdk";
import SiteConfig from "@/lib/SiteConfig";

export function useFeatureFlags() {
    return useFlags();
}

export function useFeatureEnabled(feature) {
    const flags = useFeatureFlags();
    let enabled = feature in flags && flags[feature];
    console.log(`feature ${feature} enabled? ${enabled}`);
    return enabled;
}

const siteConfig = new SiteConfig();
const config = {
    clientSideID: siteConfig.getValue('launchdarkly.clientSideId'),
    context: {
        kind: 'user',
        key: 'example-user-key',
        name: 'Sandy'
    }
};

function FeatureFlagProvider({ children }) {
    return children;
}

export default withLDProvider(config)(FeatureFlagProvider);
