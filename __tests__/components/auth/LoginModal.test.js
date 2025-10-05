import React, { useEffect, useState } from 'react';
import LoginModal from "@/components/auth/LoginModal";
import { render } from "@testing-library/react";
import ModalProvider from "@/components/modal/ModalProvider";
import FeatureFlagProvider from "@/components/flags/FeatureFlagProvider";
import { useFlags } from "launchdarkly-react-client-sdk";
import { AuthenticationProvider } from "@/components/auth/AuthenticationContext";

jest.mock('launchdarkly-react-client-sdk', () => {
    return {
        useFlags: jest.fn(),
        withLDProvider: function (config) {
            return function (Component) {
                return Component;
            }
        }
    };
});

function ExampleComponent({ children }) {
    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(true);
    }, []);

    return (
        <>{show && children}</>
    )
}

function renderScaffold({ onVisibilityChange = () => false }) {
    return render(
        <FeatureFlagProvider>
            <AuthenticationProvider>
                <ModalProvider>
                    <ExampleComponent>
                        <LoginModal onVisibilityChange={onVisibilityChange} />
                    </ExampleComponent>
                </ModalProvider>
            </AuthenticationProvider>
        </FeatureFlagProvider>
    );
}

describe('LoginModal', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('renders login form when userLogin feature is enabled', () => {
        useFlags.mockReturnValue({ userLogin: true });
        const { getByPlaceholderText } = renderScaffold({});
        expect(getByPlaceholderText('email')).toBeTruthy();
        expect(getByPlaceholderText('password')).toBeTruthy();
    });

    it('shows disabled message when userLogin feature is disabled', () => {
        useFlags.mockReturnValue({ userLogin: false });
        const { getByText, queryByPlaceholderText } = renderScaffold({});
        expect(getByText('Login functionality has been disabled.')).toBeTruthy();
        expect(queryByPlaceholderText('email')).toBeNull();
        expect(queryByPlaceholderText('password')).toBeNull();
    });

    it('shows disabled message when userLogin feature is not defined', () => {
        useFlags.mockReturnValue({});
        const { getByText, queryByPlaceholderText } = renderScaffold({});
        expect(getByText('Login functionality has been disabled.')).toBeTruthy();
        expect(queryByPlaceholderText('email')).toBeNull();
        expect(queryByPlaceholderText('password')).toBeNull();
    });
});
