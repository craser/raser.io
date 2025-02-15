import * as amplitude from '@amplitude/analytics-browser';
import { createContext, useContext, useEffect } from "react";
import SiteConfig from "@/lib/SiteConfig";

const log = (...args) => {
    console.log(...args);
}

const AnalyticsContextObj = createContext({
    firePageView: log,
    fireImgFail: log,
    fireUiEngagement: log,
    fireReferrer: log,
    fireEvent: log,
})

export function useAnalytics() {
    return useContext(AnalyticsContextObj);
}

export default function AnalyticsProvider({ children }) {
    let siteConfig = new SiteConfig();
    const apiKey = siteConfig.getValue('amplitude.apiKey');
    const options = siteConfig.getValue('amplitude.options');
    useEffect(() => {
        window.addEventListener('load', () => {
            amplitude.init(apiKey, options);
        });
    }, []);

    return (
        <AnalyticsContextObj.Provider value={buildAnalyticsContext()}>
            {children}
        </AnalyticsContextObj.Provider>
    );
}

function buildAnalyticsContext() {

    const fire = (eventName) => {
        try {
            console.info(`analytics event: "${eventName}"`);
            amplitude.track(eventName);
        } catch (e) {
            console.error(`error while logging analytics event`, e);
            console.error(e);
        }
    };
    return {
        fire, // Free-form events. Use sparingly, I think? Should I even open this door?
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
