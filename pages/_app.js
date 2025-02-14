import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import SearchProvider from "@/components/search/SearchProvider";
import DataProvider from "@/components/api/DataProvider";

export default function App({ Component, pageProps }) {
    return (
        <AnalyticsProvider>
            <AuthenticationContext>
                <DataProvider>
                    <SearchProvider>
                        <Component {...pageProps} />
                    </SearchProvider>
                </DataProvider>
            </AuthenticationContext>
        </AnalyticsProvider>
    );
}
