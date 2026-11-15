// ABOUTME: Guards the props LogEntries hands to ReadPostView for each list entry, and its page loading.
// ABOUTME: List entries render without next/prev navigation; reaching the bottom loads the next page.
import { act, render, waitFor } from '@testing-library/react';
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

    /** An IntersectionObserver the test triggers by hand; returns the instances it creates. */
    function controllableObserver() {
        const instances = [];
        global.IntersectionObserver = class {
            constructor(callback) {
                this.callback = callback;
                this.observed = [];
                this.disconnected = false;
                instances.push(this);
            }
            observe(element) {
                this.observed.push(element);
                this.disconnected = false;
            }
            disconnect() {
                this.disconnected = true;
            }
            reachBottom() {
                this.callback([{ isIntersecting: true }]);
            }
        };
        return instances;
    }

    function liveObserver(instances) {
        return instances.filter(o => !o.disconnected && o.observed.length > 0).pop();
    }

    it('loads the next page each time the reader reaches the bottom', async () => {
        const observers = controllableObserver();
        mockPostDao.getEntries
            .mockResolvedValueOnce([{ entryId: 'PAGE_0' }])
            .mockResolvedValueOnce([{ entryId: 'PAGE_1' }]);
        const { findByTestId } = render(<LogEntries initialPage={0} pageSize={30}/>);

        await act(async () => liveObserver(observers).reachBottom());
        expect(await findByTestId('mock-read-post-view-PAGE_0')).toBeInTheDocument();
        await act(async () => liveObserver(observers).reachBottom());
        expect(await findByTestId('mock-read-post-view-PAGE_1')).toBeInTheDocument();

        expect(mockPostDao.getEntries.mock.calls).toEqual([[0, 30], [1, 30]]);
    });

    it('does not request another page while one is still loading', async () => {
        const observers = controllableObserver();
        let finishLoading;
        mockPostDao.getEntries.mockReturnValueOnce(new Promise(resolve => { finishLoading = resolve; }));
        render(<LogEntries initialPage={0} pageSize={30}/>);

        await act(async () => liveObserver(observers).reachBottom());
        await act(async () => liveObserver(observers).reachBottom());
        expect(mockPostDao.getEntries).toHaveBeenCalledTimes(1);

        await act(async () => finishLoading([]));
    });

    it('observes the bottom of the list, and stops when unmounted', () => {
        const observers = controllableObserver();
        const { unmount } = render(<LogEntries initialPage={0} pageSize={30}/>);
        expect(liveObserver(observers)).toBeDefined();

        unmount();
        expect(observers.every(o => o.disconnected)).toBe(true);
    });

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
