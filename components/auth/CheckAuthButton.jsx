import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function LoginButton() {
    const authContext = useAuthenticationContext();

    return (
        <button onClick={() => authContext.check()}>Check Auth</button>
    )
}
