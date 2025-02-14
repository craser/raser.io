import * as amplitude from '@amplitude/analytics-browser';
import { createContext, useContext, useEffect } from "react";

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
    useEffect(() => {
        window.addEventListener('load', () => {
            amplitude.init('fb41a11b2a1da56f45839d940d5c28b0', { "autocapture": true });
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
            //amplitude.track(eventName);
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
