import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";
import AnalyticsContext from "@/components/analytics/AnalyticsContext";

export default function App({ Component, pageProps }) {
    return (
        <AnalyticsContext>
            <AuthenticationContext>
                <Component {...pageProps} />
            </AuthenticationContext>
        </AnalyticsContext>
    );

}
