import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { useState } from "react";
import LoginModal from "@/components/auth/LoginModal";

export default function LoginButton({ className }) {
    const authContext = useAuthenticationContext();
    const clickHandler = (event) => {
        event.preventDefault();
        authContext.showLoginModal();
    }

    return (
        <a className={className} data-testid="search-button" onClick={clickHandler}>Log In</a>
    )
}
