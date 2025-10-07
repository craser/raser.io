import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import LoginModal from "@/components/auth/LoginModal";
import { auth } from "mysql/lib/protocol/Auth";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

const AuthContextObj = createContext({
    login: () => false,
    isAuthenticated: false,
    getAuthToken: () => null,
    getEmail: () => null
});

export const STATUS = {
    authenticated: 'authenticated',
    recognized: 'recognized',
    guest: 'guest'
};

export const STORAGE_KEYS = {
    user: 'rio.auth.user',
    token: 'rio.auth.token',
    expiration: 'rio.auth.expiration',
};


export function useAuthenticationContext() {
    return useContext(AuthContextObj);
}

export default function AuthenticationContext({ children }) {
    const analytics = useAnalytics();
    const [email, setEmail] = useState(null);
    const [authToken, setAuthToken] = useState(false);
    const [authExpiration, setAuthExpiration] = useState(0);
    const [authManager, setAuthManager] = useState(new AuthenticationManager());
    const [loginVisible, setLoginVisible] = useState(false);
    const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false);
    const status = getStatus();

    // on initial load, get values from local storage
    useEffect(readCredentialsFromLocalStorage, []);

    // once loaded, check authentication expiration
    useEffect(checkAuthentication, [loadedFromLocalStorage]);

    // when the status changes, hide the login modal
    useEffect(() => {
        setLoginVisible(false);
    }, [status])

    function readCredentialsFromLocalStorage() {
        if (isCsr()) {
            let email = window.localStorage.getItem(STORAGE_KEYS.user);
            let authToken = window.localStorage.getItem(STORAGE_KEYS.token);
            let expiration = window.localStorage.getItem(STORAGE_KEYS.expiration);
            if (email && authToken && expiration) {
                setEmail(email);
                setAuthToken(authToken);
                setAuthExpiration(expiration);
                setLoadedFromLocalStorage(true);
            } else {
                logout();
            }
        }
    };


    function checkAuthentication() {
        if (isCsr() && loadedFromLocalStorage) {
            if (isAuthExpired()) {
                logout();
            } else {
                authManager.check(email, authToken)
                    .then(valid => {
                        if (!valid) {
                            logout();
                        } else {
                            setEmailState(email);
                            setAuthTokenState(authToken);
                            setAuthExpirationState(authExpiration);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        logout();
                    })
            }
        }
    };

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    function isAuthExpired() {
        console.log(`checking expiration - authExpiration: ${authExpiration}`);
        if (!!authExpiration) {
            return new Date().getTime() > authExpiration;
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
        if (newEmail) {
            window.localStorage.setItem(STORAGE_KEYS.user, newEmail);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.user);
        }
    }

    function setAuthTokenState(token) {
        setAuthToken(token);
        console.log(`setAuthToken(${token}) ➤ ${authToken}`);
        if (token) {
            window.localStorage.setItem(STORAGE_KEYS.token, token);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.token);
        }
    }

    function setAuthExpirationState(timestamp) {
        setAuthExpiration(timestamp)
        console.log(`setAuthExpiration(${timestamp}) ➤ ${authExpiration}`);
        if (timestamp) {
            window.localStorage.setItem(STORAGE_KEYS.expiration, timestamp);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.expiration);
        }
    }

    function login(email, pass) {
        analytics.fire('login attempt', email);
        return authManager.login(email, pass)
            .then(auth => {
                analytics.fire('login success', email);
                setLoginVisible(false);
                setEmailState(email);
                setAuthTokenState(auth.token);
                setAuthExpirationState(auth.expires);
            })
    }

    function logout() {
        console.info(`AuthenticationContext: logging out`);
        analytics.fire('logout');
        setAuthTokenState(null);
        setAuthExpirationState(0);
    }

    function getStatus() {
        if (!!authToken) {
            return STATUS.authenticated;
        } else if (!!email) {
            return STATUS.recognized;
        } else {
            return STATUS.guest
        }
    }

    function showLoginModal() {
        setLoginVisible(true);
    }

    function hideLoginModal() {
        console.log('setting loginVisible to FALSE');
        setLoginVisible(false);
    }

    return (
        <>
            <AuthContextObj.Provider value={{ login, logout, showLoginModal, hideLoginModal, status, isAuthenticated: !!authToken, getAuthToken, getEmail }}>
                {loginVisible ? <LoginModal onVisibilityChange={(visible) => setLoginVisible(visible)}/> : null}
                {children}
            </AuthContextObj.Provider>
        </>
    )
}
