import { createContext, useContext } from "react";
import { useStatsigClient } from "@statsig/react-bindings";
import Logger from "@/components/analytics/Logger";

function ccConsole(...args) {
    console.log(...args);
}

const AnalyticsContextObj = createContext({
    fireEvent: (...args) => ccConsole(...args)
});

export function useAnalytics() {
    return useContext(AnalyticsContextObj);
}

export default function AnalyticsContext({ children }) {
    const statsigClient = useStatsigClient();
    const analytics = {
        fireEvent: (...args) => {
            ccConsole(...args);
            statsigClient.logEvent(...args)
        }
    };
    return (
        <AnalyticsContextObj.Provider value={analytics}>
            {children}
        </AnalyticsContextObj.Provider>
    );
}
