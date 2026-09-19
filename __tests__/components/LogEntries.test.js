// ABOUTME: Guards the props LogEntries hands to ReadPostView for each list entry.
// ABOUTME: List entries must render without next/prev navigation.
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogEntries from '@/components/LogEntries';

const mockReadPostViewProps = [];

jest.mock('@/components/ReadPostView', () => {
    return function MockReadPostView(props) {
        mockReadPostViewProps.push(props);
        return <div data-testid={`mock-read-post-view-${props.post.entryId}`}/>;
    };
});

jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: () => ({ firePageView: jest.fn(), fireReferrer: jest.fn() })
}));

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({
        getPostDao: () => ({ getEntries: jest.fn().mockResolvedValue([]) })
    })
}));

const mockEntries = [{ entryId: 'DUMMY_ENTRY_ID', title: 'DUMMY_TITLE' }];

describe('LogEntries', () => {
    beforeEach(() => {
        mockReadPostViewProps.length = 0;
        global.IntersectionObserver = class {
            observe() {}
            disconnect() {}
        };
    });

    it('renders a ReadPostView for each entry', () => {
        const { getByTestId } = render(<LogEntries initialEntries={mockEntries} pageSize={10}/>);
        expect(getByTestId('mock-read-post-view-DUMMY_ENTRY_ID')).toBeInTheDocument();
    });

    it('renders list entries without next/prev navigation', () => {
        render(<LogEntries initialEntries={mockEntries} pageSize={10}/>);
        expect(mockReadPostViewProps[0].showNextPrev).toBe(false);
    });
});
