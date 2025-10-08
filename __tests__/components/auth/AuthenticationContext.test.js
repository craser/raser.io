// ABOUTME: Tests for AuthenticationContext component
// ABOUTME: Ensures analytics events are fired correctly during login attempts and success/failure scenarios

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AuthenticationContext, {
    STATUS,
    STORAGE_KEYS,
    useAuthenticationContext
} from '@/components/auth/AuthenticationContext';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import AuthenticationManager from '@/lib/api/AuthenticationManager';
import { MockLocalStorage } from '@/__tests__/mocks/LocalStorage';
import AuthGuest from '@/components/auth/AuthGuest';
import AuthRecognized from '@/components/auth/AuthRecognized';
import AuthLoggedIn from '@/components/auth/AuthLoggedIn';

const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'test-password';
const TEST_TOKEN = 'test-token';


jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: jest.fn()
}));

jest.mock('@/lib/api/AuthenticationManager');

function ContextSpy({ setContext }) {
    const authContext = useAuthenticationContext();
    React.useEffect(() => setContext(authContext), [authContext, setContext]);
    return null;
}

async function renderScaffold({ email, token, expiration, expectedStatus, children }) {
    window.localStorage.setItem(STORAGE_KEYS.user, email);
    window.localStorage.setItem(STORAGE_KEYS.token, token);
    window.localStorage.setItem(STORAGE_KEYS.expiration, expiration);

    let authContext;
    const setContext = (ctx) => {
        authContext = ctx;
    };

    const waitForStatus = async (status) => {
        await waitFor(() => {
            expect(authContext.getStatus()).toBe(status);
        });
        return authContext;
    }

    const result = render(
        <AuthenticationContext>
            <ContextSpy setContext={setContext} />
            <div id="example-wrapper">
                <div data-expected-status={expectedStatus} />
                {children}
            </div>
        </AuthenticationContext>
    );
    await waitForStatus(expectedStatus);
    return { result, authContext, waitForStatus };
}

async function renderFreshScaffold(children) {
    return renderScaffold({
        email: null,
        token: null,
        expiration: null,
        expectedStatus: STATUS.guest,
        children
    });
}

async function renderRecognizedScaffold(children) {
    return renderScaffold({
        email: TEST_EMAIL,
        token: TEST_TOKEN,
        expiration: Date.now() - 3600000, // 1 hour in the past - EXPIRED
        expectedStatus: STATUS.recognized,
        children
    });
}

async function renderAuthenticatedScaffold(children) {
    return renderScaffold({
        email: TEST_EMAIL,
        token: TEST_TOKEN,
        expiration: Date.now() + 3600000, // 1 hour in the future - VALID
        expectedStatus: STATUS.authenticated,
        children
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
        const { authContext } = await renderFreshScaffold();
        await expectFreshState(authContext);
    });

    it('authenticated state', async () => {
        const { authContext } = await renderAuthenticatedScaffold();
        await expectAuthenticatedState(authContext);
    });

    it('recognized (formerly logged-in, now expired)', async () => {
        const { authContext } = await renderRecognizedScaffold();
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

        let { authContext, waitForStatus } = await renderFreshScaffold();
        await expectFreshState(authContext, localStorageMock);
        await authContext.login(TEST_EMAIL, TEST_PASSWORD);
        authContext = await waitForStatus(STATUS.authenticated);
        await expectAuthenticatedState(authContext, localStorageMock);
        await expectLocalStorageValues(localStorageMock, TEST_EMAIL, TEST_TOKEN, expires);
    });

    it('login failed: fresh → fresh', async () => {
        mockAuthManager.login.mockRejectedValue(new Error('Invalid credentials'));
        const { authContext } = await renderFreshScaffold();
        await expect(authContext.login(TEST_EMAIL, TEST_PASSWORD)).rejects.toThrow();
        await expectFreshState(authContext, localStorageMock);
    });

    it('logout: authenticated → recognized', async () => {
        const { authContext } = await renderAuthenticatedScaffold();
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
        mockAuthManager.login.mockResolvedValue({
            token: 'test-token',
            expires: Date.now() + 3600000
        });
        const { authContext } = await renderFreshScaffold();
        await authContext.login(TEST_EMAIL, TEST_PASSWORD);
        expect(mockAnalytics.fire).toHaveBeenCalledWith('login attempt', TEST_EMAIL);
    });

    it('fires "login success" event when login succeeds', async () => {
        mockAuthManager.login.mockResolvedValue({
            token: TEST_TOKEN,
            expires: Date.now() + 3600000
        });
        const { authContext } = await renderFreshScaffold();
        await authContext.login(TEST_EMAIL, TEST_PASSWORD);
        expect(mockAnalytics.fire).toHaveBeenCalledWith('login success', TEST_EMAIL);
    });

    it('does NOT fire "login success" event when login fails', async () => {
        mockAuthManager.login.mockRejectedValue(new Error('Invalid credentials'));
        const { authContext } = await renderFreshScaffold();
        await expect(authContext.login(TEST_EMAIL, 'wrongpassword')).rejects.toThrow();
        expect(mockAnalytics.fire).toHaveBeenCalledWith('login attempt', TEST_EMAIL);
        expect(mockAnalytics.fire).not.toHaveBeenCalledWith('login success', TEST_EMAIL);
    });

    it('fires "logout" event when logout is called', async () => {
        const { authContext } = await renderFreshScaffold();
        authContext.logout();
        expect(mockAnalytics.fire).toHaveBeenCalledWith('logout');
    });
});


describe('User Authentication Check Components', () => {
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

    it('AuthLoggedIn, Guest → hide', async () => {
        let { result, authContext, waitForStatus } = await renderFreshScaffold(
            <AuthLoggedIn>
                <div data-testid="example-content-fresh-context" />
            </AuthLoggedIn>
        );
        await expectFreshState(authContext);
        expect(result.findByTestId('example-content-fresh-context')).resolves.toBeFalsy();
    })

    it('AuthLoggedIn, Recognized → hide', async () => {
        let { result, authContext } = await renderRecognizedScaffold(
            <AuthLoggedIn>
                <div data-testid="example-content-recognized-context" />
            </AuthLoggedIn>
        );
        await expectRecognizedState(authContext);
        expect(result.findByTestId('example-content-recognized-context')).resolves.toBeFalsy();
    });

    it('AuthLoggedIn, Authenticated → show', async () => {
        let { result, authContext } = await renderAuthenticatedScaffold(
            <AuthLoggedIn>
                <div data-testid="example-content-authorized-context" />
            </AuthLoggedIn>
        );
        await expectAuthenticatedState(authContext);
        expect(result.findByTestId('example-content-authorized-context')).resolves.toBeTruthy();
    })

    it('AuthGuest, Guest → show', async () => {
        let { result, authContext, waitForStatus } = await renderFreshScaffold(
            <AuthGuest>
                <div data-testid="example-content" />
            </AuthGuest>
        );
        expect(result.findByTestId('example-content')).resolves.toBeTruthy();
    })

    it('AuthGuest, Recognized → hide', async () => {
        let { result, authContext } = await renderAuthenticatedScaffold(
            <AuthGuest>
                <div data-testid="example-content" />
            </AuthGuest>
        );
        await expectAuthenticatedState(authContext);
        expect(result.findByTestId('example-content')).resolves.toBeFalsy();
    });

    it('AuthGuest, Authenticated → hide', async () => {
        let { result, authContext, waitForStatus } = await renderRecognizedScaffold(
            <AuthGuest>
                <div data-testid="example-content" />
            </AuthGuest>
        );
        expect(result.findByTestId('example-content')).resolves.toBeFalsy();
    })

    it('AuthRecognized, Guest → hide', async () => {
        let { result, authContext, waitForStatus } = await renderFreshScaffold(
            <AuthRecognized>
                <div data-testid="example-content" />
            </AuthRecognized>
        );
        expect(result.findByTestId('example-content')).resolves.toBeFalsy();
    })

    it('AuthRecognized, Recognized → show', async () => {
        let { result, authContext } = await renderAuthenticatedScaffold(
            <AuthRecognized>
                <div data-testid="example-content" />
            </AuthRecognized>
        );
        await expectAuthenticatedState(authContext);
        expect(result.findByTestId('example-content')).resolves.toBeTruthy();
    });

    it('AuthRecognized, Authenticated → hide', async () => {
        let { result, authContext, waitForStatus } = await renderRecognizedScaffold(
            <AuthRecognized>
                <div data-testid="example-content" />
            </AuthRecognized>
        );
        expect(result.findByTestId('example-content')).resolves.toBeFalsy();
    })

});

