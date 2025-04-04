
import { render } from '@testing-library/react';
import App from '@/pages/_app';

// Mock next/head
jest.mock('next/head', () => {
    return function NextHead({ children }) { 
        return <div data-testid="mock-next-head">{children}</div>; 
    };
});

/*<FeatureFlagProvider>
    <AnalyticsProvider>
        <AuthenticationContext>
            <DataProvider>
                <SearchProvider>
                    <ModalProvider>*/


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

function SampleComponent(props) {
    return (
        <div>
            <h1>Sample Component</h1>
            {props.children}
        </div>
    );
}

function renderScaffold() {
    return render(
        <App 
            Component={(props) => <SampleComponent {...props} />} 
            pageProps={{}} 
        />
    );
}

describe('_app.js', () => {

    it('should render without error', () => {
        const { container } = renderScaffold();
        expect(container).toBeTruthy();
    });

});
