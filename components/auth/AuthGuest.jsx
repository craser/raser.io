import { STATUS, useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthGuest({ children }) {
    const { status } = useAuthenticationContext();
    return <>{(status === STATUS.guest) ? children : null}</>
}
