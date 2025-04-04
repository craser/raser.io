import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the components
jest.mock('@/components/flags/FeatureFlagProvider', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="mock-feature-flag-provider">{children}</div>
  };
});

jest.mock('@/components/analytics/AnalyticsProvider', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="mock-analytics-provider">{children}</div>
  };
});

jest.mock('@/components/auth/AuthenticationContext', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="mock-auth-context">{children}</div>
  };
});

jest.mock('@/components/api/DataProvider', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="mock-data-provider">{children}</div>
  };
});

jest.mock('@/components/search/SearchProvider', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="mock-search-provider">{children}</div>
  };
});

jest.mock('@/components/modal/ModalProvider', () => {
  return {
    __esModule: true,
    ModalProvider: ({ children }) => <div data-testid="mock-modal-provider">{children}</div>
  };
});

jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="mock-next-head">{children}</div>
  };
});

// Mock the CSS import
jest.mock('@/styles/globals.scss', () => {
  return {};
});

// Test component
const MockComponent = () => <div>Mock Page Component</div>;

// Import the component under test after all mocks
const App = require('@/pages/_app').default;

describe('App Component', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <App Component={MockComponent} pageProps={{}} />
    );
    
    expect(getByText('Mock Page Component')).toBeInTheDocument();
  });
});