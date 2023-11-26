import Home from '../index'
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function LoginPage() {
    const authContext = useAuthenticationContext();
    if (!authContext.isLoggedIn()) {
        authContext.showLogin();
    }
    return <Home />
}
