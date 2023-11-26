import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import LoginModal from "@/components/auth/LoginModal";

const AuthContextObj = createContext({})

export function useAuthenticationContext() {
    return useContext(AuthContextObj);
}

export default function AuthenticationContext({ showLoginModal, children }) {

    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [authManager, setAuthManager] = useState(new AuthenticationManager());
    const [loginVisible, setLoginVisible] = useState(showLoginModal);

    function showLogin() {
        setLoginVisible(true);
    }

    function hideLogin() {
        setLoginVisible(false);
    }

    function getAuthToken() {
        return authToken;
    }

    function login(user, pass) {
        return authManager.login(user, pass)
            .then(auth => {
                console.log('login successful', auth);
                setUser(user);
                setAuthToken(auth.token);
                hideLogin();
            })
    }

    function check() {
        return authManager.check(user, authToken)
            .then(success => {
                console.log('auth check successful', success);
            })
            .catch(error => {
                console.log('auth check failed', error);
            })
    }

    function isLoggedIn() {
        return !!user;
    }

    return (
        <>
            {loginVisible ? <LoginModal login={login} hideLogin={hideLogin}/> : null}
            <AuthContextObj.Provider value={{ showLogin, login, check, isLoggedIn, getAuthToken }}>
                {children}
            </AuthContextObj.Provider>
        </>
    )
}
