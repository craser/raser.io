import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import SearchProvider from "@/components/search/SearchProvider";
import DataProvider from "@/components/api/DataProvider";
import FeatureFlagProvider from "@/components/flags/FeatureFlagProvider";
import { ModalProvider } from "@/components/modal/ModalProvider";

export default function App({ Component, pageProps }) {
    return (
        <FeatureFlagProvider>
            <AnalyticsProvider>
                <AuthenticationContext>
                    <DataProvider>
                        <SearchProvider>
                            <ModalProvider>
                                <Component {...pageProps} />
                            </ModalProvider>
                        </SearchProvider>
                    </DataProvider>
                </AuthenticationContext>
            </AnalyticsProvider>
        </FeatureFlagProvider>
    );
}
