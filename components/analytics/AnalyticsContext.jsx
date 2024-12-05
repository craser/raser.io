import { createContext, useContext } from "react";
import { StatsigProvider, useStatsigClient } from "@statsig/react-bindings";
import { SiteConfig } from "@/lib/SiteConfig";

function ccConsole(...args) {
    console.log(...args);
}

export function useAnalytics() {
    const statsig = useStatsigClient();
    return {
        fireEvent: (...args) => {
            ccConsole(...args);
            console.log(`logging to statsig: ${args.join('|')}`);
            statsig.logEvent(args.join('|'))
        }
    };
}

export default function AnalyticsContext({ children }) {
    const sdkKey = new SiteConfig().getValue('statsig.sdkKey');
    return (
        <StatsigProvider
            sdkKey={sdkKey}
            user={{ userID: 'guest', email: 'none@example.com' }}
        >
            {children}
        </StatsigProvider>
    );
}
