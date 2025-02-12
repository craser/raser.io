import { StatsigProvider, useStatsigClient } from "@statsig/react-bindings";
import SiteConfig from "@/lib/SiteConfig";

function ccConsole(...args) {
    console.log(...args);
}

export function useAnalytics() {
    const statsig = useStatsigClient();
    return buildAnalyticsContext(statsig);
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

function buildAnalyticsContext(statsig) {
    const fire = (eventName, value, metadata) => {
        try {
            const event = { eventName, value, metadata };
            ccConsole('analytics event: ', event);
            statsig.logEvent(event);
        } catch (e) {
            console.error(`error while logging analytics event`, e);
            console.error(e);
        }
    };
    return {
        firePageView: (value, metadata) => fire('pageview', value, metadata),
        fireImgFail: (imageName, metadata) => fire('imgfail', imageName, metadata),
        fireUiEngagement: (element, action, metadata) => fire('engagement', `${element}`, { ...metadata, action }),
        fireReferrer: (referrer, metadata) => {
            try {
                let referrerHost = new URL(referrer).host;
                if (referrerHost !== window.location.host) {
                    fire('referred', referrerHost, { ...metadata, referrer, host: referrerHost });
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
}
