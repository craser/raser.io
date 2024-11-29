import { createContext, useContext, useEffect, useState } from "react";
import AuthenticationManager from "@/lib/api/AuthenticationManager";
import LoginModal from "@/components/auth/LoginModal";
import { auth } from "mysql/lib/protocol/Auth";
import { useAnalytics } from "@/components/analytics/AnalyticsContext";

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
    const logger = useAnalytics();

    const [email, setEmail] = useState(null);
    const [authToken, setAuthToken] = useState(false);
    const [authExpiration, setAuthExpiration] = useState(0);
    const [authManager, setAuthManager] = useState(new AuthenticationManager());
    const [loginVisible, setLoginVisible] = useState(false);
    const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false);


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
    }, []);

    useEffect(() => {
        setLoginVisible(false);
    }, [getStatus()])

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
                        logger.fireEvent(error);
                        logout();
                    })
            }
        }
    }, [loadedFromLocalStorage]);

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    function isAuthExpired() {
        logger.log(`checking expiration - authExpiration: ${authExpiration}`);
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
        logger.log(`setEmail(${newEmail}) ➤ ${email}`);
        if (newEmail) {
            window.localStorage.setItem(STORAGE_KEYS.user, newEmail);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.user);
        }
    }

    function setAuthTokenState(token) {
        setAuthToken(token);
        logger.log(`setAuthToken(${token}) ➤ ${authToken}`);
        if (token) {
            window.localStorage.setItem(STORAGE_KEYS.token, token);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.token);
        }
    }

    function setAuthExpirationState(timestamp) {
        setAuthExpiration(timestamp)
        logger.log(`setAuthExpiration(${timestamp}) ➤ ${authExpiration}`);
        if (timestamp) {
            window.localStorage.setItem(STORAGE_KEYS.expiration, timestamp);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.expiration);
        }
    }

    function login(email, pass) {
        logger.debug('AuthenticationContext.login()', email, pass);
        return authManager.login(email, pass)
            .then(auth => {
                logger.log('login successful', auth);
                setLoginVisible(false);
                setEmailState(email);
                setAuthTokenState(auth.token);
                setAuthExpirationState(auth.expires);
            })
    }

    function logout() {
        logger.info(`AuthenticationContext: logging out`);
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
        logger.log('setting loginVisible to FALSE');
        setLoginVisible(false);
    }

    return (
        <>
            <AuthContextObj.Provider value={{ login, logout, showLoginModal, hideLoginModal, status: getStatus(), isAuthenticated: !!authToken, getAuthToken, getEmail }}>
                {loginVisible ? <LoginModal onVisibilityChange={(visible) => setLoginVisible(visible)}/> : null}
                {children}
            </AuthContextObj.Provider>
        </>
    )
}
