// ABOUTME: Tests for BlogData — the server-side in-memory blog data store.
// ABOUTME: Uses jest.resetModules() + jest.doMock() to inject test data without file I/O.

const MOCK_POSTS = [
    { entryId: '3', title: 'Newest', datePosted: '2023-01-03T00:00:00', attachments: [] },
    { entryId: '1', title: 'Oldest', datePosted: '2023-01-01T00:00:00', attachments: [] },
    { entryId: '2', title: 'Middle', datePosted: '2023-01-02T00:00:00', attachments: [] },
];

let BlogData;

beforeEach(() => {
    jest.resetModules();
    jest.doMock('fs', () => ({
        readFileSync: jest.fn().mockReturnValue(JSON.stringify(MOCK_POSTS)),
    }));
    jest.doMock('path', () => ({
        join: jest.fn().mockReturnValue('/mock/posts.json'),
    }));
    BlogData = require('@/lib/data/BlogData').default;
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('getInstance()', () => {
    test('returns a singleton', () => {
        const a = BlogData.getInstance();
        const b = BlogData.getInstance();
        expect(a).toBe(b);
    });
});

describe('getEntries()', () => {
    test('returns entries with default arguments', () => {
        const entries = BlogData.getInstance().getEntries();
        expect(entries).toHaveLength(3);
        expect(entries[0].entryId).toBe('3');
    });

    test('returns entries sorted newest-first', () => {
        const entries = BlogData.getInstance().getEntries(0, 10);
        expect(entries[0].entryId).toBe('3');
        expect(entries[1].entryId).toBe('2');
        expect(entries[2].entryId).toBe('1');
    });

    test('paginates correctly', () => {
        const data = BlogData.getInstance();
        const page0 = data.getEntries(0, 2);
        const page1 = data.getEntries(1, 2);
        expect(page0).toHaveLength(2);
        expect(page0[0].entryId).toBe('3');
        expect(page1).toHaveLength(1);
        expect(page1[0].entryId).toBe('1');
    });

    test('returns empty array past last page', () => {
        expect(BlogData.getInstance().getEntries(99, 10)).toHaveLength(0);
    });
});

describe('getPostById()', () => {
    test('finds post by string id', () => {
        expect(BlogData.getInstance().getPostById('2').title).toBe('Middle');
    });

    test('finds post by numeric id', () => {
        expect(BlogData.getInstance().getPostById(2).title).toBe('Middle');
    });

    test('returns null for unknown id', () => {
        expect(BlogData.getInstance().getPostById('999')).toBeNull();
    });
});

describe('getNextPost()', () => {
    test('returns the newer post', () => {
        // Sorted: [3(newest), 2(middle), 1(oldest)]
        // next of '2' (middle) is '3' (newer)
        expect(BlogData.getInstance().getNextPost('2').entryId).toBe('3');
    });

    test('returns null for the newest post', () => {
        expect(BlogData.getInstance().getNextPost('3')).toBeNull();
    });

    test('returns null for unknown id', () => {
        expect(BlogData.getInstance().getNextPost('999')).toBeNull();
    });
});

describe('getPrevPost()', () => {
    test('returns the older post', () => {
        // prev of '2' (middle) is '1' (older)
        expect(BlogData.getInstance().getPrevPost('2').entryId).toBe('1');
    });

    test('returns null for the oldest post', () => {
        expect(BlogData.getInstance().getPrevPost('1')).toBeNull();
    });

    test('returns null for unknown id', () => {
        expect(BlogData.getInstance().getPrevPost('999')).toBeNull();
    });
});

describe('getSearchStubs()', () => {
    test('returns entries with default arguments', () => {
        const stubs = BlogData.getInstance().getSearchStubs();
        expect(stubs).toHaveLength(3);
        expect(stubs[0].entryId).toBe('3');
    });

    test('returns up to numEntries posts, newest-first', () => {
        const stubs = BlogData.getInstance().getSearchStubs(2);
        expect(stubs).toHaveLength(2);
        expect(stubs[0].entryId).toBe('3');
    });

    test('returns all posts when numEntries exceeds total', () => {
        expect(BlogData.getInstance().getSearchStubs(1000)).toHaveLength(3);
    });
});
