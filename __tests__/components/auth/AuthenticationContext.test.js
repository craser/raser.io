// ABOUTME: Tests for AuthenticationContext component
// ABOUTME: Ensures analytics events are fired correctly during login attempts and success/failure scenarios

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AuthenticationContext, { useAuthenticationContext } from '@/components/auth/AuthenticationContext';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import AuthenticationManager from '@/lib/api/AuthenticationManager';

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

describe('AuthenticationContext', () => {
    let mockAnalytics;
    let mockAuthManager;

    beforeEach(() => {
        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        global.window = { localStorage: localStorageMock };

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
        render(
            <AuthenticationContext>
                <TestComponent onLogin={(ctx) => { authContext = ctx; }} />
            </AuthenticationContext>
        );

        await waitFor(() => expect(authContext).toBeDefined());

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
        render(
            <AuthenticationContext>
                <TestComponent onLogin={(ctx) => { authContext = ctx; }} />
            </AuthenticationContext>
        );

        await waitFor(() => expect(authContext).toBeDefined());

        await authContext.login(email, password);

        expect(mockAnalytics.fire).toHaveBeenCalledWith('login success', email);
    });

    it('does NOT fire "login success" event when login fails', async () => {
        const email = 'test@example.com';
        const password = 'wrongpassword';

        mockAuthManager.login.mockRejectedValue(new Error('Invalid credentials'));

        let authContext;
        render(
            <AuthenticationContext>
                <TestComponent onLogin={(ctx) => { authContext = ctx; }} />
            </AuthenticationContext>
        );

        await waitFor(() => expect(authContext).toBeDefined());

        await expect(authContext.login(email, password)).rejects.toThrow();

        expect(mockAnalytics.fire).toHaveBeenCalledWith('login attempt', email);
        expect(mockAnalytics.fire).not.toHaveBeenCalledWith('login success', email);
    });
});
