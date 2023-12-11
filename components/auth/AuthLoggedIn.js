import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthLoggedIn({ children }) {
    const { isLoggedIn } = useAuthenticationContext();
    console.info(`AuthLoggedIn: isLoggedIn: ${isLoggedIn}`);
    return <>{isLoggedIn ? children : null}</>
}

