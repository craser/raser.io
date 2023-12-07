import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import LoginModal from "@/components/auth/LoginModal";

const AuthContextObj = createContext({
    login: () => false,
    isLoggedIn: () => false,
    getAuthToken: () => null,
    getEmail: () => null
})

export function useAuthenticationContext() {
    return useContext(AuthContextObj);
}

export default function AuthenticationContext({ children }) {

    const [email, setEmail] = useState(null);
    const [authToken, setAuthToken] = useState(false);
    const [authManager, setAuthManager] = useState(new AuthenticationManager());

    useEffect(() => {
        if (isCsr()) {
            console.log('setting auth context user & token');
            setEmailState(window.localStorage.getItem('rio.user'));
            setAuthTokenState(window.localStorage.getItem('rio.auth'));
        }
    }, []);

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    function getAuthToken() {
        return authToken;
    }

    function getEmail() {
        return email;
    }

    function setEmailState(email) {
        setEmail(email);
        if (email) {
            window.localStorage.setItem('rio.user', email);
        } else {
            window.localStorage.removeItem('rio.user');
        }
    }

    function setAuthTokenState(token) {
        setAuthToken(token);
        if (token) {
            window.localStorage.setItem('rio.auth', token);
        } else {
            window.localStorage.removeItem('rio.auth');
        }
    }

    function login(user, pass) {
        console.debug('AuthenticationContext.login()', user, pass);
        return authManager.login(user, pass)
            .then(auth => {
                console.log('login successful', auth);
                setEmailState(user);
                setAuthTokenState(auth.token);
            })
    }

    function logout() {
        setEmailState(null);
        setAuthTokenState(null);
    }

    return (
        <>
            <AuthContextObj.Provider value={{ login, logout, isLoggedIn: !!email, getAuthToken, getEmail }}>
                {children}
            </AuthContextObj.Provider>
        </>
    )
}
