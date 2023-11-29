import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import LoginModal from "@/components/auth/LoginModal";

const AuthContextObj = createContext({
    showLogin: () => false,
    login: () => false,
    check: () => false,
    isLoggedIn: () => false,
    getAuthToken: () => null
})

export function useAuthenticationContext() {
    return useContext(AuthContextObj);
}

export default function AuthenticationContext({ showLoginModal, children }) {

    const [user, setUserState] = useState(null);
    const [authToken, setAuthTokenState] = useState(false);
    const [authManager, setAuthManager] = useState(new AuthenticationManager());
    const [loginVisible, setLoginVisible] = useState(showLoginModal);

    useEffect(() => {
        if (isCsr()) {
            setUserState(window.localStorage.getItem('rio.user'));
            setAuthTokenState(window.localStorage.getItem('rio.auth'));
        }
    });

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    function showLogin() {
        setLoginVisible(true);
    }

    function hideLogin() {
        setLoginVisible(false);
    }

    function getAuthToken() {
        return authToken;
    }

    function setUser(email) {
        setUserState(email);
        window.localStorage.setItem('rio.user', email);
    }

    function setAuthToken(token) {
        setAuthTokenState(token);
        window.localStorage.setItem('rio.auth', token);
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
