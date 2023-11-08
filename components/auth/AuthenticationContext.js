import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import Cookies from 'js-cookie';
import LoginModal from "@/components/auth/LoginModal";

const AuthContextObj = createContext({})

export function useAuthenticationContext() {
    return useContext(AuthContextObj);
}

export default function AuthenticationContext({ children }) {

    const [userName, setUserName] = useState(null);
    const [authManager, setAuthManager] = useState(new AuthenticationManager());
    const [recognized, setRecognized] = useState(false);
    const [loginVisible, setLoginVisible] = useState(false);

    useEffect(() => {
        const name = Cookies.get('raserio-user');
        console.log(`user name: ${name}`);
        setRecognized(!!name);
    }, [])

    function showLogin() {
        setLoginVisible(true);
    }

    function hideLogin() {
        setLoginVisible(false);
    }

    function authenticate() {
        authManager.mock_login();
        hideLogin();
        setRecognized(true);
    }

    function isRecognized() {
        return recognized;
    }

    return (
        <>
            {loginVisible ? <LoginModal authenticate={authenticate} hideLogin={hideLogin}/> : null}
            <AuthContextObj.Provider value={{ showLogin, authenticate, isRecognized }}>
                {children}
            </AuthContextObj.Provider>
        </>
    )
}
