import Home from '../index'
import AuthenticationContext, { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function LoginPage() {
    const authContext = useAuthenticationContext();
    authContext.showLogin();
    return <Home />
}
