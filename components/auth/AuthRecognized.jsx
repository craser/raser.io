import { useAuthenticationContext, STATUS } from "@/components/auth/AuthenticationContext";

export default function AuthRecognized({ children }) {
    const { status } = useAuthenticationContext();
    return <>{ (status === STATUS.recognized) ? children : null}</>
}

