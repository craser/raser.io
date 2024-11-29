import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import { StatsigProvider } from "@statsig/react-bindings";
import { SiteConfig } from "@/lib/SiteConfig";
import AnalyticsContext from "@/components/analytics/AnalyticsContext";

export default function App({ Component, pageProps }) {
    const statsigConfig = new SiteConfig().getValue('statsig');
    return (
        <StatsigProvider sdkKey={statsigConfig.sdkKey} user={{ userID: "0000", email: "noone@nowhere.com" }}>
            <AnalyticsContext>
                <AuthenticationContext>
                    <Component {...pageProps} />
                </AuthenticationContext>
            </AnalyticsContext>
        </StatsigProvider>
    );

}
