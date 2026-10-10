// ABOUTME: Guards the props LogEntries hands to ReadPostView for each list entry.
// ABOUTME: List entries must render without next/prev navigation.
import { render, waitFor } from '@testing-library/react';
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

const mockPostDao = {
    getEntries: jest.fn(),
    getEntriesByTag: jest.fn()
};

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({
        getPostDao: () => mockPostDao
    })
}));

const mockEntries = [{ entryId: 'DUMMY_ENTRY_ID', title: 'DUMMY_TITLE' }];

describe('LogEntries', () => {
    beforeEach(() => {
        mockReadPostViewProps.length = 0;
        mockPostDao.getEntries.mockReset().mockResolvedValue([]);
        mockPostDao.getEntriesByTag.mockReset().mockResolvedValue([]);
        global.IntersectionObserver = class {
            observe() {}
            disconnect() {}
        };
    });

    /** An IntersectionObserver that reports the page bottom as visible as soon as it is observed. */
    function scrollToBottomOnObserve() {
        global.IntersectionObserver = class {
            constructor(callback) {
                this.callback = callback;
            }
            observe() {
                this.callback([{ isIntersecting: true }]);
            }
            disconnect() {}
        };
    }

    it('renders a ReadPostView for each entry', () => {
        const { getByTestId } = render(<LogEntries initialEntries={mockEntries} pageSize={10}/>);
        expect(getByTestId('mock-read-post-view-DUMMY_ENTRY_ID')).toBeInTheDocument();
    });

    it('renders list entries without next/prev navigation', () => {
        render(<LogEntries initialEntries={mockEntries} pageSize={10}/>);
        expect(mockReadPostViewProps[0].showNextPrev).toBe(false);
    });

    it('loads pages of all posts when given no tag', async () => {
        scrollToBottomOnObserve();
        render(<LogEntries initialPage={0} pageSize={30}/>);
        await waitFor(() => expect(mockPostDao.getEntries).toHaveBeenCalledWith(0, 30));
        expect(mockPostDao.getEntriesByTag).not.toHaveBeenCalled();
    });

    it('loads pages of the tag\'s posts when given a tag', async () => {
        scrollToBottomOnObserve();
        mockPostDao.getEntriesByTag.mockResolvedValue([{ entryId: 'DUMMY_TAGGED_ENTRY_ID' }]);
        const { findByTestId } = render(<LogEntries tag="DUMMY_TAG" initialPage={0} pageSize={30}/>);
        expect(await findByTestId('mock-read-post-view-DUMMY_TAGGED_ENTRY_ID')).toBeInTheDocument();
        expect(mockPostDao.getEntriesByTag).toHaveBeenCalledWith('DUMMY_TAG', 0, 30);
        expect(mockPostDao.getEntries).not.toHaveBeenCalled();
    });
});
