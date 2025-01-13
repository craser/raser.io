import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import { StatsigProvider } from "@statsig/react-bindings";
import { SiteConfig } from "@/lib/SiteConfig";
import AnalyticsContext from "@/components/analytics/AnalyticsContext";
import SearchProvider from "@/components/search/SearchProvider";
import DataProvider from "@/components/api/DataProvider";

export default function App({ Component, pageProps }) {
    const statsigsdkKey = new SiteConfig().getValue('statsig.sdkKey');
    return (
        <StatsigProvider sdkKey={statsigsdkKey} user={{ userID: "0000", email: "noone@nowhere.com" }}>
            <AnalyticsContext>
                <AuthenticationContext>
                    <DataProvider>
                        <SearchProvider>
                            <Component {...pageProps} />
                        </SearchProvider>
                    </DataProvider>
                </AuthenticationContext>
            </AnalyticsContext>
        </StatsigProvider>
    );

}
