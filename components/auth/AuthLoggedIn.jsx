import { STATUS, useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthLoggedIn({ children }) {
    const { status } = useAuthenticationContext();
    return <>{(status === STATUS.authenticated) ? children : null}</>
}
