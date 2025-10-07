import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import LoginModal from "@/components/auth/LoginModal";
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
    console.log('AuthenticationContext: rendering');
    const analytics = useAnalytics();
    const [authManager, setAuthManager] = useState(new AuthenticationManager());
    const [loginVisible, setLoginVisible] = useState(false);
    const [status, setStatus] = useState(STATUS.guest); // we use this to trigger re-renders

    // on initial load, get values from local storage
    useEffect(loadCredentialsFromLocalStorage, []);

    function loadCredentialsFromLocalStorage() {
        console.log('AuthenticationContext: loading credentials from local storage');
        if (isCsr()) {
            let email = window.localStorage.getItem(STORAGE_KEYS.user);
            let authToken = window.localStorage.getItem(STORAGE_KEYS.token);
            let expiration = window.localStorage.getItem(STORAGE_KEYS.expiration);
            if (email && authToken && expiration) {
                checkAuthentication();
            } else if (email) {
                logout(); // incomplete credentials - log out & clean up
            } else {
                setStatus(STATUS.guest);
            }
        }
    };


    function checkAuthentication() {
        console.log('AuthenticationContext: checking authentication');
        if (isAuthExpired()) {
            logout();
        } else {
            authManager.check(getEmail(), getAuthToken())
                .then(valid => {
                    if (!valid) {
                        logout();
                    } else {
                        setStatus(STATUS.authenticated);
                    }
                })
                .catch(error => {
                    console.error(error);
                    logout();
                })

        }
    };

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    function isAuthExpired() {
        console.log(`AuthenticationContext: checking expiration - authExpiration: ${getAuthExpiration()}`);
        const authExpiration = getAuthExpiration();
        if (!!authExpiration) {
            return new Date().getTime() > authExpiration;
        } else {
            return true;
        }
    }

    function getAuthToken() {
        return window.localStorage.getItem(STORAGE_KEYS.token) || null;
    }

    function getEmail() {
        return window.localStorage.getItem(STORAGE_KEYS.user) || null;
    }

    function getAuthExpiration() {
        return parseInt(window.localStorage.getItem(STORAGE_KEYS.expiration)) || 0;
    }

    function getStatus() {
        return status;
    }

    function setLocalStorageItem(key, value) {
        if (value) {
            window.localStorage.setItem(key, value);
        } else {
            window.localStorage.removeItem(key);
        }
    }

    function setEmail(newEmail) {
        console.log(`AuthenticationContext: setting email to ${newEmail}`);
        setLocalStorageItem(STORAGE_KEYS.user, newEmail);
    }

    function setAuthToken(token) {
        console.log(`AuthenticationContext: setting auth token to ${token}`); // FIXME: REMOVE THIS
        setLocalStorageItem(STORAGE_KEYS.token, token);
    }

    function setAuthExpiration(timestamp) {
        console.log(`AuthenticationContext: setting auth expiration to ${timestamp}`);
        setLocalStorageItem(STORAGE_KEYS.expiration, timestamp);
    }

    function login(email, pass) {
        console.log(`AuthenticationContext: logging in with email ${email}`);
        analytics.fire('login attempt', email);
        return authManager.login(email, pass)
            .then(auth => {
                console.log(`AuthenticationContext: login successful with email ${email}`);
                analytics.fire('login success', email);
                setLoginVisible(false);
                setEmail(email);
                setAuthToken(auth.token);
                setAuthExpiration(auth.expires);
                setStatus(STATUS.authenticated);
            })
    }

    function logout() {
        console.info(`AuthenticationContext: logging out`);
        analytics.fire('logout');
        setAuthToken(null);
        setAuthExpiration(null);
        setStatus(STATUS.recognized);
    }

    function showLoginModal() {
        setLoginVisible(true);
    }

    function hideLoginModal() {
        console.log('AuthenticationContext: hiding login modal');
        setLoginVisible(false);
    }

    const ctx = {
        login,
        logout,
        showLoginModal,
        hideLoginModal,
        getStatus,
        status,
        isAuthenticated: () => (status === STATUS.authenticated),
        getAuthToken,
        getEmail
    };
    return (
        <>
            <AuthContextObj.Provider value={ctx}>
                {loginVisible ? <LoginModal onVisibilityChange={(visible) => setLoginVisible(visible)} /> : null}
                {children}
            </AuthContextObj.Provider>
        </>
    )
}
