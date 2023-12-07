import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthGuest({ children }) {
    const { isLoggedIn } = useAuthenticationContext();
    return <>{isLoggedIn ? null : children}</>
}

