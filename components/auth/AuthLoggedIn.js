import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthLoggedIn({ children }) {
    const authContext = useAuthenticationContext();
    return <>{authContext.isLoggedIn() ? children : null}</>
}

