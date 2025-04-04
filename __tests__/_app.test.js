import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a simpler mock for next/head
jest.mock('next/head', () => {
    return {
        __esModule: true,
        default: function Head({ children }) {
            return <div data-testid="next-head">{children}</div>;
        }
    };
});

// Mock the components
jest.mock('@/components/flags/FeatureFlagProvider', () => {
    return function MockFeatureFlagProvider({ children }) {
        return (<div data-testid="mock-FeatureFlagProvider">{children}</div>);
    };
});

jest.mock('@/components/analytics/AnalyticsProvider', () => {
    return function MockAnalyticsProvider({ children }) {
        return (<div data-testid="mock-AnalyticsProvider">{children}</div>);
    };
});

jest.mock('@/components/auth/AuthenticationContext', () => {
    return function MockAuthenticationContext({ children }) {
        return (<div data-testid="mock-AuthenticationContext">{children}</div>);
    };
});

jest.mock('@/components/api/DataProvider', () => {
    return function MockDataProvider({ children }) {
        return (<div data-testid="mock-DataProvider">{children}</div>);
    };
});

jest.mock('@/components/search/SearchProvider', () => {
    return function MockSearchProvider({ children }) {
        return (<div data-testid="mock-SearchProvider">{children}</div>);
    };
});

jest.mock('@/components/modal/ModalProvider', () => {
    return function MockModalProvider({ children }) {
        return (<div data-testid="mock-ModalProvider">{children}</div>);
    };
});

// Mock the CSS import
jest.mock('@/styles/globals.scss', () => {
    return {};
});

// Test component
function MockComponent({ children }) {
    return <div data-testid="mock-page-component">I want to be an Air Force Ranger!</div>;
}

// Import the component under test after all mocks
import App from '@/pages/_app';

function renderScaffold() {
    return render(
        <App Component={MockComponent} pageProps={{}}/>
    );
}

describe('App Component', () => {
    it('renders without crashing', () => {
        const { getByTestId } = renderScaffold();
        expect(getByTestId('mock-page-component')).toBeInTheDocument();
    });

    it('renders all required providers', () => {
        const { getByTestId } = renderScaffold();
        expect(getByTestId('mock-FeatureFlagProvider')).toBeInTheDocument();
        expect(getByTestId('mock-AnalyticsProvider')).toBeInTheDocument();
        expect(getByTestId('mock-AuthenticationContext')).toBeInTheDocument();
        expect(getByTestId('mock-DataProvider')).toBeInTheDocument();
        expect(getByTestId('mock-SearchProvider')).toBeInTheDocument();
        expect(getByTestId('mock-ModalProvider')).toBeInTheDocument();
    });

    it('should render an rss link in the head', () => {
        const { getByTestId } = renderScaffold();
        const headElement = getByTestId('next-head');
        const link = headElement.querySelector('link[rel="alternate"][type="application/rss+xml"]');
        expect(link).toBeTruthy();
        expect(link).toHaveAttribute('href', '/rss');
    });

    it('should render the component passed as a prop', () => {
        const { getByTestId } = renderScaffold();
        expect(getByTestId('mock-page-component')).toBeInTheDocument();
    });
});
