import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import AnalyticsContext from "@/components/analytics/AnalyticsContext";
import SearchProvider from "@/components/search/SearchProvider";
import DataProvider from "@/components/api/DataProvider";

export default function App({ Component, pageProps }) {
    return (
        <AnalyticsContext>
            <AuthenticationContext>
                <DataProvider>
                    <SearchProvider>
                        <Component {...pageProps} />
                    </SearchProvider>
                </DataProvider>
            </AuthenticationContext>
        </AnalyticsContext>
    );
}
