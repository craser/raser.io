import '@/styles/globals.scss'
import AuthenticationContext from "@/components/auth/AuthenticationContext";

export default function App({ Component, pageProps }) {
    return (
        <AuthenticationContext>
            <Component {...pageProps} />
        </AuthenticationContext>
    );

}
