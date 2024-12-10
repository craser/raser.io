import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import { StatsigProvider } from "@statsig/react-bindings";
import { SiteConfig } from "@/lib/SiteConfig";
import AnalyticsContext from "@/components/analytics/AnalyticsContext";
import SearchContext from "@/components/search/SearchContext";

export default function App({ Component, pageProps }) {
    const statsigConfig = new SiteConfig().getValue('statsig');
    return (
        <StatsigProvider sdkKey={statsigConfig.sdkKey} user={{ userID: "0000", email: "noone@nowhere.com" }}>
            <AnalyticsContext>
                <AuthenticationContext>
                    <SearchContext>
                        <Component {...pageProps} />
                    </SearchContext>
                </AuthenticationContext>
            </AnalyticsContext>
        </StatsigProvider>
    );

}
