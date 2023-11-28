import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SecurePage({ children }) {
    const { isLoggedIn, showLogin } = useAuthenticationContext();
    if (!isLoggedIn()) {
        showLogin();
        return <FrontPageLayout content={
            <LoadingSpinner />
        }/>
    } else {
        return <>{children}</>
    }
}
