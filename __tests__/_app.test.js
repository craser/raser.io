import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the components
jest.mock('@/components/flags/FeatureFlagProvider', () => {
    return function MockFeatureFlagProvider({ children }) { return (<div data-testid="mock-FeatureFlagProvider">{children}</div>); };
});

jest.mock('@/components/analytics/AnalyticsProvider', () => {
    return function MockAnalyticsProvider({ children }) { return (<div data-testid="mock-AnalyticsProvider">{children}</div>); };
});

jest.mock('@/components/auth/AuthenticationContext', () => {
    return function MockAuthenticationContext({ children }) { return (<div data-testid="mock-AuthenticationContext">{children}</div>); };
});

jest.mock('@/components/api/DataProvider', () => {
    return function MockDataProvider({ children }) { return (<div data-testid="mock-DataProvider">{children}</div>); };
});

jest.mock('@/components/search/SearchProvider', () => {
    return function MockSearchProvider({ children }) { return (<div data-testid="mock-SearchProvider">{children}</div>); };
});

jest.mock('@/components/modal/ModalProvider', () => {
    return function MockModalProvider({ children }) { return (<div data-testid="mock-ModalProvider">{children}</div>); };
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
    const { container } = renderScaffold();
    const link = container.querySelector('link');
    expect(link).toBeTruthy();
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/rss');
  });
});
