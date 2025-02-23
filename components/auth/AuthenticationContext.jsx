import { createContext, useCallback, useContext, useEffect, useState } from "react";
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

let STORAGE_KEYS = {
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

    // load values from local storage
    useEffect(() => {
        if (isCsr()) {
            let newEmail = window.localStorage.getItem(STORAGE_KEYS.user);
            let newAuthToken = window.localStorage.getItem(STORAGE_KEYS.token);
            let newExpiration = parseInt(window.localStorage.getItem(STORAGE_KEYS.expiration));
            setEmail(newEmail);
            setAuthToken(newAuthToken);
            setAuthExpiration(newExpiration);
            setLoadedFromLocalStorage(true);
        }
    }, [authExpiration, authManager, authToken, email, isAuthExpired, logout, setAuthExpirationState, setAuthTokenState, setEmailState]);
    useEffect(() => {
        setLoginVisible(false);
    }, [status])

    useEffect(() => {
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
    }, [loadedFromLocalStorage, isAuthExpired]);

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    const isAuthExpired = useCallback(() => {
        console.log(`checking expiration - authExpiration: ${authExpiration}`);
        if (!!authExpiration) {
            return new Date().getTime() > authExpiration;
        } else {
            return true;
        }
    }, [authExpiration]);

    function getAuthToken() {
        return authToken;
    }

    function getEmail() {
        return email;
    }

    const setEmailState = useCallback((newEmail) => {
        setEmail(newEmail);
        if (newEmail) {
            window.localStorage.setItem(STORAGE_KEYS.user, newEmail);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.user);
        }
    }, [setEmail]);

    const setAuthTokenState = useCallback((token) => {
        setAuthToken(token);
        console.log(`setAuthToken(${token}) ➤ ${authToken}`);
        if (token) {
            window.localStorage.setItem(STORAGE_KEYS.token, token);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.token);
        }
    }, [setAuthToken]);

    const setAuthExpirationState = useCallback((timestamp)=> {
        setAuthExpiration(timestamp)
        console.log(`setAuthExpiration(${timestamp}) ➤ ${authExpiration}`);
        if (timestamp) {
            window.localStorage.setItem(STORAGE_KEYS.expiration, timestamp);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.expiration);
        }
    }, [setAuthExpiration]);

    function login(email, pass) {
        analytics.fireEvent('login attempt', email);
        return authManager.login(email, pass)
            .then(auth => {
                analytics.fireEvent('login success', email);
                setLoginVisible(false);
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
