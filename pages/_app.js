import '@/styles/globals.scss';
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import SearchProvider from "@/components/search/SearchProvider";
import DataProvider from "@/components/api/DataProvider";
import FeatureFlagProvider from "@/components/flags/FeatureFlagProvider";
import ModalProvider from "@/components/modal/ModalProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";
import Head from 'next/head';
import { JetBrains_Mono, Lato } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Self-hosted by next/font: no requests to Google, preloaded, size-adjusted fallbacks.
// JetBrains Mono is a variable font, so one file covers every weight.
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], display: 'swap' });

export default function App({ Component, pageProps }) {
    return (
        <FeatureFlagProvider>
            {/* On :root, not a wrapper element, so portaled modals get the fonts too. */}
            <style jsx global>{`
                :root {
                    --font-jetbrains-mono: ${jetbrainsMono.style.fontFamily};
                    --font-lato: ${lato.style.fontFamily};
                }
            `}</style>
            <ThemeProvider>
                <AnalyticsProvider>
                    <ModalProvider>
                        <DataProvider>
                            <SearchProvider>
                                <Head>
                                    <link rel="alternate" type="application/rss+xml" href="/rss"/>
                                </Head>
                                <Component {...pageProps} />
                                {/* Real-user Core Web Vitals per route; only reports on Vercel deployments. */}
                                <SpeedInsights />
                            </SearchProvider>
                        </DataProvider>
                    </ModalProvider>
                </AnalyticsProvider>
            </ThemeProvider>
        </FeatureFlagProvider>
    );
}
