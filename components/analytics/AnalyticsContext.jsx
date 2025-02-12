
function ccConsole(...args) {
    console.log(...args);
}

export function useAnalytics() {
    return buildAnalyticsContext();
}

export default function AnalyticsContext({ children }) {
    return (
        <>{children}</>
    );
}

function buildAnalyticsContext() {
    const fire = (eventName, value, metadata) => {
        try {
            const event = { eventName, value, metadata };
            ccConsole('analytics event: ', event);
            // FIXME: Actually implement some kind of... y'know... analytics.
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
