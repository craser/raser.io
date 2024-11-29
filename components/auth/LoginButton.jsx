import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { useState } from "react";
import LoginModal from "@/components/auth/LoginModal";

export default function LoginButton() {
    const authContext = useAuthenticationContext();

    return (
        <>
            <button onClick={() => authContext.showLoginModal()}>Log In</button>
        </>

    )
}
