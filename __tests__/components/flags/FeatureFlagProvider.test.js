import { useFlags, withLDProvider } from "launchdarkly-react-client-sdk";
import FeatureFlagProvider, { useFeatureEnabled } from "@/components/flags/FeatureFlagProvider";
import { render, waitFor } from "@testing-library/react";
import FeatureEnabled from "@/components/flags/FeatureEnabled";
import FeatureDisabled from "@/components/flags/FeatureDisabled";

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


function renderScaffold(Component) {
    return render(
        <FeatureFlagProvider>
            <Component/>
        </FeatureFlagProvider>
    );
}

describe('FeatureFlagProvider', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should render children', async () => {
        const result = await renderScaffold(() => <div data-testid="child">child</div>);
        expect(result.getByTestId('child')).toBeTruthy();
    });

    it('should support useFlags (positive)', async () => {
        useFlags.mockReturnValue({ dummyFeature: true });
        const result = renderScaffold(() => {
            if (useFeatureEnabled('dummyFeature')) {
                return <div data-testid="enabled">enabled</div>;
            } else {
                return <div data-testid="disabled">disabled</div>;
            }
        });
        expect(result.getByTestId('enabled')).toBeTruthy();
    });

    it('should support useFlags (implicit negative)', () => {
        useFlags.mockReturnValue({});
        const result = renderScaffold(() => {
            if (useFeatureEnabled('nope')) {
                return <div data-testid="enabled">enabled</div>;
            } else {
                return <div data-testid="disabled">disabled</div>;
            }
        });
        expect(result.getByTestId('disabled')).toBeTruthy();
    });

    it('should support useFlags (explicit negative)', () => {
        useFlags.mockReturnValue({ nope: false });
        const result = renderScaffold(() => {
            if (useFeatureEnabled('nope')) {
                return <div data-testid="enabled">enabled</div>;
            } else {
                return <div data-testid="disabled">disabled</div>;
            }
        });
        expect(result.getByTestId('disabled')).toBeTruthy();
    });

});

describe('FeatureEnabled', () => {

    it('should show children if feature is enabled', () => {
        useFlags.mockReturnValue({ dummyFeature: true });
        const result = render(
            <FeatureFlagProvider>
                <FeatureEnabled feature="dummyFeature">
                    <div data-testid="enabled">enabled</div>
                </FeatureEnabled>
            </FeatureFlagProvider>
        );
        expect(result.getByTestId('enabled')).toBeTruthy();
    });

    it('should not show children if feature is disabled', () => {
        useFlags.mockReturnValue({ dummyFeature: false });
        const result = render(
            <FeatureFlagProvider>
                <FeatureEnabled feature="dummyFeature">
                    <div data-testid="enabled">enabled</div>
                </FeatureEnabled>
            </FeatureFlagProvider>
        );
        expect(() => result.getByTestId('enabled')).toThrow();
    });
});

describe('FeatureDisabled', () => {

    it('should show children if feature is disabled', () => {
        useFlags.mockReturnValue({ dummyFeature: false });
        const result = render(
            <FeatureFlagProvider>
                <FeatureDisabled feature="dummyFeature">
                    <div data-testid="disabled">disabled</div>
                </FeatureDisabled>
            </FeatureFlagProvider>
        );
        expect(result.getByTestId('disabled')).toBeTruthy();
    });

    it('should not show children if feature is enabled', () => {
        useFlags.mockReturnValue({ dummyFeature: true });
        const result = render(
            <FeatureFlagProvider>
                <FeatureDisabled feature="dummyFeature">
                    <div data-testid="disabled">disabled</div>
                </FeatureDisabled>
            </FeatureFlagProvider>
        );
        expect(() => result.getByTestId('disabled')).toThrow();
    });
});

