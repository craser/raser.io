// ABOUTME: Tests for AuthenticationContext component
// ABOUTME: Ensures analytics events are fired correctly during login attempts and success/failure scenarios

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AuthenticationContext, { useAuthenticationContext, STORAGE_KEYS } from '@/components/auth/AuthenticationContext';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import AuthenticationManager from '@/lib/api/AuthenticationManager';

jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: jest.fn()
}));

jest.mock('@/lib/api/AuthenticationManager');

const MockLocalStorage = jest.fn(() => {
    const store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            value ? store[key] = (value) : delete store[key];
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
        })
    };
});

function TestComponent({ onLogin }) {
    const authContext = useAuthenticationContext();

    React.useEffect(() => {
        if (onLogin) {
            onLogin(authContext);
        }
    }, [authContext, onLogin]);

    return null;
}

async function renderScaffold({ email, token, expiration, callback }) {
    window.localStorage.setItem(STORAGE_KEYS.user, email);
    window.localStorage.setItem(STORAGE_KEYS.token, token);
    window.localStorage.setItem(STORAGE_KEYS.expiration, expiration);

    let done = false;
    const onLogin = (...args) => {
        done = true;
        callback(...args);
    };
    const result = render(
        <AuthenticationContext>
            <TestComponent onLogin={onLogin} />
        </AuthenticationContext>
    );
    await waitFor(() => expect(done).toBe(true));
    return result;
}

describe('AuthenticationContext Lifecycle', () => {
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

    it('should report no email, no token, and not authenticated initially', async () => {
        let authContext;
        await renderScaffold({
            email: null, token: null, expiration: null, callback: (ctx) => {
                authContext = ctx;
            }
        });
        expect(authContext.getEmail()).toBeFalsy();
        expect(authContext.getAuthToken()).toBeFalsy();
        expect(authContext.isAuthenticated).toBe(false);
    });

    it('should report email, token, and authenticated when valid token is in localStorage', async () => {
        const email = 'test@test.com';
        const token = 'valid-token';
        const expiration = Date.now() + 3600000; // 1 hour in the future

        let authContext;
        const callback = (ctx) => authContext = ctx;
        await renderScaffold({ email, token, expiration, callback });

        expect(authContext.getEmail()).toBe(email);
        expect(authContext.getAuthToken()).toBe(token);
        expect(authContext.isAuthenticated).toBe(true);
    });

    it('should report no email, no token, and not authenticated when expired token is in localStorage', async () => {
        const email = 'test@teset.com';
        const token = 'expired token';
        const expiration = Date.now() - 3600000; // 1 hour in the past

        let authContext;
        const callback = (ctx) => authContext = ctx;
        await renderScaffold({ email, token, expiration, callback });

        expect(authContext.getAuthToken()).toBeFalsy();
        expect(authContext.isAuthenticated).toBe(false);

        // should effectively log the user out - email remains, but auth token & expiration are cleared
        expect(authContext.getEmail()).toBe(email);
        expect(localStorageMock.getItem(STORAGE_KEYS.token)).toBeNull();
        expect(localStorageMock.getItem(STORAGE_KEYS.expiration)).toBeNull();
    });

})


describe('AuthenticationContext', () => {
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
        const password = 'password123';

        mockAuthManager.login.mockResolvedValue({
            token: 'test-token',
            expires: Date.now() + 3600000
        });

        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        await authContext.login(email, password);

        expect(mockAnalytics.fire).toHaveBeenCalledWith('login attempt', email);
    });

    it('fires "login success" event when login succeeds', async () => {
        const email = 'test@example.com';
        const password = 'password123';

        mockAuthManager.login.mockResolvedValue({
            token: 'test-token',
            expires: Date.now() + 3600000
        });

        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        await authContext.login(email, password);

        expect(mockAnalytics.fire).toHaveBeenCalledWith('login success', email);
    });

    it('does NOT fire "login success" event when login fails', async () => {
        const email = 'test@example.com';
        const password = 'wrongpassword';

        mockAuthManager.login.mockRejectedValue(new Error('Invalid credentials'));

        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        await expect(authContext.login(email, password)).rejects.toThrow();

        expect(mockAnalytics.fire).toHaveBeenCalledWith('login attempt', email);
        expect(mockAnalytics.fire).not.toHaveBeenCalledWith('login success', email);
    });

    it('stores auth token and expiry date in localStorage on successful login', async () => {
        const email = 'test@example.com';
        const password = 'password123';
        const testToken = 'test-token-abc123';
        const testExpires = Date.now() + 3600000;

        mockAuthManager.login.mockResolvedValue({
            token: testToken,
            expires: testExpires
        });

        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        await authContext.login(email, password);

        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.token, testToken);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.expiration, testExpires);
        });
    });

    it('does NOT store auth token or expiry in localStorage on failed login', async () => {
        const email = 'test@example.com';
        const password = 'wrongpassword';

        mockAuthManager.login.mockRejectedValue(new Error('Invalid credentials'));

        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        await expect(authContext.login(email, password)).rejects.toThrow();

        expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
            expect.stringMatching(/rio\.auth\.(token|expiration)/),
            expect.anything()
        );
    });

    it('fires "logout" event when logout is called', async () => {
        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        authContext.logout();

        expect(mockAnalytics.fire).toHaveBeenCalledWith('logout');
    });

    it('removes auth token and expiry from localStorage on logout', async () => {
        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        authContext.logout();

        await waitFor(() => {
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.token);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.expiration);
        });
    });

    it('getEmail and getAuthToken return correct values after successful login', async () => {
        const email = 'test@example.com';
        const password = 'password123';
        const testToken = 'test-token-xyz';
        const testExpires = Date.now() + 3600000;

        mockAuthManager.login.mockResolvedValue({
            token: testToken,
            expires: testExpires
        });

        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        await authContext.login(email, password);

        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.user, email);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.token, testToken);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.expiration, testExpires);
            expect(authContext.getEmail()).toBe(email);
            expect(authContext.getAuthToken()).toBe(testToken);
        });
    });

    it('getAuthToken returns null after logout', async () => {
        const email = 'test@example.com';
        const password = 'password123';

        mockAuthManager.login.mockResolvedValue({
            token: 'test-token',
            expires: Date.now() + 3600000
        });

        let authContext;
        await renderScaffold({
            email: null,
            token: null,
            expiration: null,
            callback: (ctx) => { authContext = ctx; }
        });

        await authContext.login(email, password);

        authContext.logout();

        await waitFor(() => {
            expect(authContext.getAuthToken()).toBeNull();
        });
    });
});
