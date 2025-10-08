// ABOUTME: Tests for AuthenticationContext component
// ABOUTME: Ensures analytics events are fired correctly during login attempts and success/failure scenarios

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AuthenticationContext, {
    STORAGE_KEYS,
    STATUS,
    useAuthenticationContext
} from '@/components/auth/AuthenticationContext';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import AuthenticationManager from '@/lib/api/AuthenticationManager';
import { MockLocalStorage } from '@/__tests__/mocks/LocalStorage';

const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'test-password';
const TEST_TOKEN = 'test-token';


jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: jest.fn()
}));

jest.mock('@/lib/api/AuthenticationManager');

function TestComponent({ onLogin }) {
    const authContext = useAuthenticationContext();

    React.useEffect(() => {
        if (onLogin) {
            onLogin(authContext);
        }
    }, [authContext, onLogin]);

    return null;
}

async function renderScaffold({ email, token, expiration, callback, expectedStatus }) {
    window.localStorage.setItem(STORAGE_KEYS.user, email);
    window.localStorage.setItem(STORAGE_KEYS.token, token);
    window.localStorage.setItem(STORAGE_KEYS.expiration, expiration);

    let authContext;
    const onLogin = (ctx) => {
        authContext = ctx;
        callback(ctx);
    };
    const result = render(
        <AuthenticationContext>
            <TestComponent onLogin={onLogin} />
        </AuthenticationContext>
    );
    await waitFor(() => expect(authContext.getStatus()).toBe(expectedStatus));
    return result;
}

async function renderFreshScaffold(callback) {
    return renderScaffold({
        email: null,
        token: null,
        expiration: null,
        callback,
        expectedStatus: STATUS.guest });
}

async function renderRecognizedScaffold(callback) {
    return renderScaffold({
        email: TEST_EMAIL,
        token: TEST_TOKEN,
        expiration: Date.now() - 3600000, // 1 hour in the past - EXPIRED
        callback,
        expectedStatus: STATUS.recognized
    });
}

async function renderAuthenticatedScaffold(callback) {
    return renderScaffold({
        email: TEST_EMAIL,
        token: TEST_TOKEN,
        expiration: Date.now() + 3600000, // 1 hour in the future - VALID
        callback,
        expectedStatus: STATUS.authenticated
    });
}

async function expectFreshState(authContext, localStorage = window.localStorage) {
    await waitFor(() => {
        expect(authContext.getEmail()).toBeNull();
        expect(authContext.getAuthToken()).toBeNull();
        expect(authContext.isAuthenticated()).toBe(false);
        expect(authContext.getStatus()).toBe(STATUS.guest);
        expect(authContext.status).toBe(STATUS.guest)



        expect(localStorage.getItem(STORAGE_KEYS.user)).toBeFalsy();
        expect(localStorage.getItem(STORAGE_KEYS.token)).toBeFalsy();
        expect(localStorage.getItem(STORAGE_KEYS.expiration)).toBeFalsy();
    });
}

async function expectRecognizedState(authContext, localStorage = window.localStorage) {
    await waitFor(() => {
        expect(authContext.getEmail()).toBe(TEST_EMAIL);
        expect(authContext.getAuthToken()).toBeFalsy();
        expect(authContext.isAuthenticated()).toBe(false);
        expect(authContext.getStatus()).toBe(STATUS.recognized);

        expect(localStorage.getItem(STORAGE_KEYS.user)).toBe(TEST_EMAIL);
        expect(localStorage.getItem(STORAGE_KEYS.token)).toBeFalsy();
        expect(localStorage.getItem(STORAGE_KEYS.expiration)).toBeFalsy();
    });
}

async function expectAuthenticatedState(authContext, localStorage = window.localStorage) {
    await waitFor(() => {
        expect(authContext.getEmail()).toBe(TEST_EMAIL);
        expect(authContext.getAuthToken()).toBe(TEST_TOKEN);
        expect(authContext.isAuthenticated()).toBe(true);
        expect(authContext.getStatus()).toBe(STATUS.authenticated);

        expect(localStorage.getItem(STORAGE_KEYS.user)).toBe(TEST_EMAIL);
        expect(localStorage.getItem(STORAGE_KEYS.token)).toBe(TEST_TOKEN);
        expect(localStorage.getItem(STORAGE_KEYS.expiration)).toBeTruthy();
    });
}

async function expectLocalStorageValues(localStorage, email, token, expiration) {
    await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.user)).toBe(email);
        expect(localStorage.getItem(STORAGE_KEYS.token)).toBe(token);
        expect(localStorage.getItem(STORAGE_KEYS.expiration)).toBe(expiration);
    });
}

/**
 * 3 states:
 *   - fresh: no email, no token, not authenticated (landing on site for first time)
 *   - recognized: email, token, authenticated (returning visitor, previously authenticated)
 *   - authenticated: email, token, authenticated (logged-in user)
 *
 * 4 transitions:
 *   - login: fresh → authenticated
 *   - logout: authenticated → recognized
 *   - token expiration: authenticated → recognized
 *   - login: recognized → authenticated
 */
describe('AuthenticationContext Initialization', () => {
    let mockAnalytics;
    let mockAuthManager;
    let localStorageMock;

    beforeEach(() => {
        localStorageMock = new MockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Mock analytics
        mockAnalytics = {
            fire: jest.fn()
        };
        useAnalytics.mockReturnValue(mockAnalytics);

        // Mock AuthenticationManager
        mockAuthManager = {
            login: jest.fn(),
            check: jest.fn().mockResolvedValue(true)
        };
        AuthenticationManager.mockImplementation(() => mockAuthManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('fresh state', async () => {
        let authContext;
        const callback = (ctx) => {
            authContext = ctx;
        };
        await renderFreshScaffold(callback);
        await expectFreshState(authContext);
    });

    it('authenticated state', async () => {
        let authContext;
        const callback = (ctx) => authContext = ctx;
        await renderAuthenticatedScaffold(callback);
        await expectAuthenticatedState(authContext);
    });

    it('recognized (formerly logged-in, now expired)', async () => {
        let authContext;
        const callback = (ctx) => authContext = ctx;
        await renderRecognizedScaffold(callback);
        await expectRecognizedState(authContext);
    });

})

/* 4 transitions:
 *   - login: fresh → authenticated
 *   - logout: authenticated → recognized
 *   - token expiration: authenticated → recognized // happens on page load, so covered in initialization tests
 *   - login: recognized → authenticated
 */
describe('AuthenticationContext Transitions', () => {
    let mockAnalytics;
    let mockAuthManager;
    let localStorageMock;

    beforeEach(() => {
        // Mock localStorage using Object.defineProperty to ensure it's on the actual window object
        localStorageMock = new MockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Mock analytics
        mockAnalytics = {
            fire: jest.fn()
        };
        useAnalytics.mockReturnValue(mockAnalytics);

        // Mock AuthenticationManager
        mockAuthManager = {
            login: jest.fn(),
            check: jest.fn().mockResolvedValue(true)
        };
        AuthenticationManager.mockImplementation(() => mockAuthManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('login: fresh → authenticated', async () => {
        const expires = Date.now() + 3600000;
        mockAuthManager.login.mockResolvedValue({ token: TEST_TOKEN, expires });

        let authContext;
        let callback = (ctx) => {
            authContext = ctx;
        };
        await renderFreshScaffold(callback);
        await expectFreshState(authContext, localStorageMock);
        await authContext.login(TEST_EMAIL, TEST_PASSWORD);
        const oldCtx = authContext;
        await waitFor(() => {
            expect(authContext).not.toBe(oldCtx);
        });
        await expectAuthenticatedState(authContext, localStorageMock);
        await expectLocalStorageValues(localStorageMock, TEST_EMAIL, TEST_TOKEN, expires);
    });

    it('login failed: fresh → fresh', async () => {
        mockAuthManager.login.mockRejectedValue(new Error('Invalid credentials'));
        let authContext;
        const callback = (ctx) => {
            authContext = ctx;
        };
        await renderFreshScaffold(callback);
        await expect(authContext.login(TEST_EMAIL, TEST_PASSWORD)).rejects.toThrow();
        await expectFreshState(authContext, localStorageMock);
    });

    it('logout: authenticated → recognized', async () => {
        let authContext;
        const callback = (ctx) => {
            authContext = ctx;
        };
        await renderAuthenticatedScaffold(callback);
        authContext.logout();
        expectRecognizedState(authContext, localStorageMock);
    });


});


describe('AuthenticationContext Analytics', () => {
    let mockAnalytics;
    let mockAuthManager;
    let localStorageMock;

    beforeEach(() => {
        // Mock localStorage using Object.defineProperty to ensure it's on the actual window object
        localStorageMock = new MockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Mock analytics
        mockAnalytics = {
            fire: jest.fn()
        };
        useAnalytics.mockReturnValue(mockAnalytics);

        // Mock AuthenticationManager
        mockAuthManager = {
            login: jest.fn(),
            check: jest.fn().mockResolvedValue(true)
        };
        AuthenticationManager.mockImplementation(() => mockAuthManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('fires "login attempt" event when login is called', async () => {
        const email = 'test@example.com';
        const password = TEST_PASSWORD;

        mockAuthManager.login.mockResolvedValue({
            token: 'test-token',
            expires: Date.now() + 3600000
        });

        let authContext;
        let callback = (ctx) => {
            authContext = ctx;
        };
        await renderFreshScaffold(callback);
        await authContext.login(email, password);

        expect(mockAnalytics.fire).toHaveBeenCalledWith('login attempt', email);
    });

    it('fires "login success" event when login succeeds', async () => {
        const email = 'test@example.com';
        const password = TEST_PASSWORD;

        mockAuthManager.login.mockResolvedValue({
            token: 'test-token',
            expires: Date.now() + 3600000
        });

        let authContext;
        const callback = (ctx) => {
            authContext = ctx;
        };
        await renderFreshScaffold(callback);

        await authContext.login(email, password);

        expect(mockAnalytics.fire).toHaveBeenCalledWith('login success', email);
    });

    it('does NOT fire "login success" event when login fails', async () => {
        const email = 'test@example.com';
        const password = 'wrongpassword';

        mockAuthManager.login.mockRejectedValue(new Error('Invalid credentials'));

        let authContext;
        const callback = (ctx) => {
            authContext = ctx;
        };
        await renderFreshScaffold(callback);
        await expect(authContext.login(email, password)).rejects.toThrow();
        expect(mockAnalytics.fire).toHaveBeenCalledWith('login attempt', email);
        expect(mockAnalytics.fire).not.toHaveBeenCalledWith('login success', email);
    });

    it('fires "logout" event when logout is called', async () => {
        let authContext;
        const callback = (ctx) => { authContext = ctx; };
        await renderFreshScaffold(callback);
        authContext.logout();

        expect(mockAnalytics.fire).toHaveBeenCalledWith('logout');
    });

})

