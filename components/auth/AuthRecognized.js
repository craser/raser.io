import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthRecognized({ children }) {
    const { status } = useAuthenticationContext();
    return <>{ (status === 'recognized') ? children : null}</>
}

