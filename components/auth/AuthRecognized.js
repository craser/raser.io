import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function AuthRecognized({ children }) {
    const authContext = useAuthenticationContext();
    return <>{authContext.isRecognized() ? children : null}</>
}

