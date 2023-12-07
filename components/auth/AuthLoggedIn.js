import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthLoggedIn({ children }) {
    const { isLoggedIn } = useAuthenticationContext();
    return <>{isLoggedIn ? children : null}</>
}

