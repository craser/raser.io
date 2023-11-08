import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function LoginButton() {
    const authContext = useAuthenticationContext();

    return (
        <button onClick={() => authContext.showLogin()}>Log In</button>
    )
}
