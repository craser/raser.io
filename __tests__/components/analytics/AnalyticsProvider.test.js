import AnalyticsProvider, { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { render } from "@testing-library/react";
import * as amplitude from '@amplitude/analytics-browser';
import matchers from "@testing-library/jest-dom/matchers";


async function renderScaffold(Component) {
    return render(
        <AnalyticsProvider>
            <Component/>
        </AnalyticsProvider>
    );
}

jest.mock('@amplitude/analytics-browser', () => ({
    init: jest.fn(),
    track: jest.fn(),
}));

describe('AnalyticsContext', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('check amplitude mocking', () => {
        expect.assertions(2);
        amplitude.init('derp', {});
        amplitude.track('flim');
        expect(amplitude.init).toHaveBeenCalledWith('derp', {});
        expect(amplitude.track).toHaveBeenCalledWith('flim');
    });

    test('should initialize with autocapture enabled', async () => {
        await renderScaffold(() => <></>);
        expect(amplitude.init).toHaveBeenCalledWith(expect.stringMatching(/.+/), { autocapture: true });
    });

    test('should exist', async () => {
        await renderScaffold(() => {
            const analyticsContext = useAnalytics();
            analyticsContext.firePageView('DUMMY_VALUE', { data: 'DUMMY_DATA' });
            return <>I want to be an Air Force Ranger!</>
        });
        expect(amplitude.init).toHaveBeenCalledTimes(1);
        expect(amplitude.track).toHaveBeenCalledWith('pageview');
    });

});
