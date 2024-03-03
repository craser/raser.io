import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import LoginModal from "@/components/auth/LoginModal";
import { auth } from "mysql/lib/protocol/Auth";

const AuthContextObj = createContext({
    login: () => false,
    isAuthenticated: false,
    getAuthToken: () => null,
    getEmail: () => null
})

export function useAuthenticationContext() {
    return useContext(AuthContextObj);
}

export default function AuthenticationContext({ children }) {

    const [email, setEmail] = useState(null);
    const [authToken, setAuthToken] = useState(false);
    const [authExpiration, setAuthExpiration] = useState(0);
    const [authManager, setAuthManager] = useState(new AuthenticationManager());
    const [loginVisible, setLoginVisible] = useState(false);

    useEffect(() => {
        if (isCsr()) {
            console.log('setting auth context user & token');
            const email = window.localStorage.getItem('rio.user');
            const auth = window.localStorage.getItem('rio.auth');
            const expiration = parseInt(window.localStorage.getItem('rio.auth.expiration'));

            if (isAuthExpired(expiration)) {
                logout();
            } else {
                authManager.check(email, auth)
                    .then(valid => {
                        if (!valid) {
                            logout();
                        } else {
                            setEmailState(email);
                            setAuthTokenState(auth);
                            setAuthExpirationState(expiration);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        logout();
                    })
            }
        }
    }, [authToken, authExpiration, email]);

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    function isAuthExpired(expiration = authExpiration) {
        console.log(`checking expiration - authExpiration: ${expiration}`);
        if (!!expiration) {
            return new Date().getTime() > expiration;
        } else {
            return true;
        }
    }

    function getAuthToken() {
        return authToken;
    }

    function getEmail() {
        return email;
    }

    function setEmailState(newEmail) {
        setEmail(newEmail);
        console.log(`setEmail(${newEmail}) ➤ ${email}`);
        if (newEmail) {
            window.localStorage.setItem('rio.user', newEmail);
        } else {
            window.localStorage.removeItem('rio.user');
        }
    }

    function setAuthTokenState(token) {
        setAuthToken(token);
        console.log(`setAuthToken(${token}) ➤ ${authToken}`);
        if (token) {
            window.localStorage.setItem('rio.auth', token);
        } else {
            window.localStorage.removeItem('rio.auth');
        }
    }

    function setAuthExpirationState(timestamp) {
        setAuthExpiration(timestamp)
        console.log(`setAuthExpiration(${timestamp}) ➤ ${authExpiration}`);
        if (timestamp) {
            window.localStorage.setItem('rio.auth.expiration', timestamp);
        } else {
            window.localStorage.removeItem('rio.auth.expiration');
        }
    }

    function login(email, pass) {
        console.debug('AuthenticationContext.login()', email, pass);
        return authManager.login(email, pass)
            .then(auth => {
                console.log('login successful', auth);
                setEmailState(email);
                setAuthTokenState(auth.token);
                setAuthExpirationState(auth.expires);
            })
    }

    function logout() {
        console.info(`AuthenticationContext: logging out`);
        setAuthTokenState(null);
        setAuthExpirationState(0);
    }

    function getStatus() {
        if (!!authToken) {
            return 'authenticated';
        } else if (!!email) {
            return 'recognized';
        } else {
            return 'guest'
        }
    }

    function showLoginModal() {
        setLoginVisible(true);
    }

    return (
        <>
            <AuthContextObj.Provider value={{ login, logout, showLoginModal, status: getStatus(), isAuthenticated: !!authToken, getAuthToken, getEmail }}>
                {loginVisible ? <LoginModal onVisibilityChange={(visible) => setLoginVisible(visible)}/> : null}
                {children}
            </AuthContextObj.Provider>
        </>
    )
}
