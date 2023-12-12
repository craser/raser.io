import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthLoggedIn({ children }) {
    const { isAuthenticated } = useAuthenticationContext();
    console.info(`AuthLoggedIn: isLoggedIn: ${isAuthenticated}`);
    return <>{isAuthenticated ? children : null}</>
}

