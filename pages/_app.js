import '@/styles/globals.scss';
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import SearchProvider from "@/components/search/SearchProvider";
import DataProvider from "@/components/api/DataProvider";
import FeatureFlagProvider from "@/components/flags/FeatureFlagProvider";
import ModalProvider from "@/components/modal/ModalProvider";
import Head from 'next/head';

export default function App({ Component, pageProps }) {
    return (
        <FeatureFlagProvider>
            <AnalyticsProvider>
                <ModalProvider>
                    <AuthenticationContext>
                        <DataProvider>
                            <SearchProvider>
                                    <Head>
                                        <link rel="alternate" type="application/rss+xml" href="/rss"/>
                                    </Head>
                                    <Component {...pageProps} />
                            </SearchProvider>
                        </DataProvider>
                    </AuthenticationContext>
                </ModalProvider>
            </AnalyticsProvider>
        </FeatureFlagProvider>
    );
}
