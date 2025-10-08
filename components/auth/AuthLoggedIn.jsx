import { STATUS, useAuthenticationContext } from "@/components/auth/AuthenticationContext";

/**
 * Renders children if the user is authenticated.
 *
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
export default function AuthLoggedIn({ children }) {
    const { status } = useAuthenticationContext();
    return <>{(status === STATUS.authenticated) ? children : null}</>
}

