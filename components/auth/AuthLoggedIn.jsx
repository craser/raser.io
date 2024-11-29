import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

/**
 * Renders children if the user is authenticated.
 *
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
export default function AuthLoggedIn({ children }) {
    const { isAuthenticated } = useAuthenticationContext();
    return <>{isAuthenticated ? children : null}</>
}

