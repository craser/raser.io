import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthGuest({ children }) {
    const { status } = useAuthenticationContext();
    return <>{(status === 'guest') ? children : null}</>
}

