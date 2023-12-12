import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { useState } from "react";
import LoginModal from "@/components/auth/LoginModal";

export default function LoginButton() {
    const authContext = useAuthenticationContext();
    const [loginVisible, setLoginVisible] = useState(false);

    return (
        <>
            <button onClick={() => setLoginVisible(true)}>Log In</button>
            {loginVisible ? <LoginModal onVisibilityChange={(visible) => setLoginVisible(visible)}/> : null}
        </>

    )
}
