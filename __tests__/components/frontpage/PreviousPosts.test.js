import PreviousPosts from '@/components/frontpage/PreviousPosts';
import { render, waitFor } from '@testing-library/react';

// Mock dependencies
jest.mock('@/components/frontpage/PageSection', () => {
    return {
        __esModule: true,
        default: ({ title, children }) => <div data-testid="page-section">{children}</div>
    };
});

jest.mock('@/components/LoadingSpinner', () => {
    return {
        __esModule: true,
        default: () => <div data-testid="loading-spinner">Loading...</div>
    };
});

jest.mock('@/components/ArchiveLink', () => {
    return {
        __esModule: true,
        default: ({ children }) => <div data-testid="archive-link">{children}</div>
    };
});

jest.mock('@/components/PostHeader', () => {
    return {
        PostHeader: ({ post }) => <div data-testid={`post-header-${post.entryId}`}>{post.title}</div>
    };
});

jest.mock('@/components/frontpage/PreviousPosts.module.scss', () => ({}));

jest.mock('lucide-react', () => ({
    ChevronRight: () => <span>→</span>,
    FileImage: () => <span>📁</span>
}));

// Mock DataProvider
const mockGetEntries = jest.fn();
const mockPostDao = {
    getEntries: mockGetEntries
};

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({
        getPostDao: () => mockPostDao
    })
}));

describe('PreviousPosts', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Component rendering with initial posts', () => {
        it('should render with initial posts', () => {
            const initialPosts = [
                { entryId: '1', title: 'Post 1' },
                { entryId: '2', title: 'Post 2' },
                { entryId: '3', title: 'Post 3' }
            ];

            const result = render(<PreviousPosts initialPosts={initialPosts} />);

            expect(result.getByTestId('page-section')).not.toBeNull();
            expect(result.getByTestId('post-header-1')).not.toBeNull();
            expect(result.getByTestId('post-header-2')).not.toBeNull();
            expect(result.getByTestId('post-header-3')).not.toBeNull();
        });

        it('should log initial posts count on component mount', () => {
            const initialPosts = [
                { entryId: '1', title: 'Post 1' },
                { entryId: '2', title: 'Post 2' },
                { entryId: '3', title: 'Post 3' }
            ];

            render(<PreviousPosts initialPosts={initialPosts} />);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[PreviousPosts] Component rendered with 3 initial posts'
            );
        });

        it('should log 0 initial posts when initialPosts is null', () => {
            mockGetEntries.mockResolvedValue([]);

            render(<PreviousPosts initialPosts={null} />);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[PreviousPosts] Component rendered with 0 initial posts'
            );
        });

        it('should log 0 initial posts when initialPosts is undefined', () => {
            mockGetEntries.mockResolvedValue([]);

            render(<PreviousPosts />);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[PreviousPosts] Component rendered with 0 initial posts'
            );
        });
    });

    describe('Client-side fetching', () => {
        it('should log fetch attempt when initialPosts is null', async () => {
            mockGetEntries.mockResolvedValue([
                { entryId: '0', title: 'Hero Post' },
                { entryId: '1', title: 'Post 1' },
                { entryId: '2', title: 'Post 2' }
            ]);

            render(<PreviousPosts initialPosts={null} />);

            await waitFor(() => {
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    '[PreviousPosts] Fetching posts from client side'
                );
            });
        });

        it('should log successful fetch with post count', async () => {
            mockGetEntries.mockResolvedValue([
                { entryId: '0', title: 'Hero Post' },
                { entryId: '1', title: 'Post 1' },
                { entryId: '2', title: 'Post 2' },
                { entryId: '3', title: 'Post 3' }
            ]);

            render(<PreviousPosts initialPosts={null} />);

            await waitFor(() => {
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    '[PreviousPosts] Successfully fetched 3 posts'
                );
            });
        });

        it('should fetch posts when initialPosts is null', async () => {
            mockGetEntries.mockResolvedValue([
                { entryId: '0', title: 'Hero Post' },
                { entryId: '1', title: 'Post 1' }
            ]);

            render(<PreviousPosts initialPosts={null} />);

            await waitFor(() => {
                expect(mockGetEntries).toHaveBeenCalledWith(0, 5);
            });
        });

        it('should NOT fetch posts when initialPosts is provided', () => {
            const initialPosts = [{ entryId: '1', title: 'Post 1' }];

            render(<PreviousPosts initialPosts={initialPosts} />);

            expect(mockGetEntries).not.toHaveBeenCalled();
        });

        it('should slice first post from fetched results', async () => {
            mockGetEntries.mockResolvedValue([
                { entryId: '0', title: 'Hero Post' },
                { entryId: '1', title: 'Post 1' },
                { entryId: '2', title: 'Post 2' }
            ]);

            const result = render(<PreviousPosts initialPosts={null} />);

            await waitFor(() => {
                expect(result.getByTestId('post-header-1')).not.toBeNull();
                expect(result.getByTestId('post-header-2')).not.toBeNull();
            });

            // Hero post should not be rendered
            expect(result.queryByTestId('post-header-0')).toBeNull();
        });
    });

    describe('Error handling', () => {
        it('should log error when fetch fails', async () => {
            const testError = new Error('Network error');
            mockGetEntries.mockRejectedValue(testError);

            render(<PreviousPosts initialPosts={null} />);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[PreviousPosts] Error fetching posts:',
                    testError
                );
            });
        });

        it('should show loading spinner when fetch fails', async () => {
            mockGetEntries.mockRejectedValue(new Error('Network error'));

            const result = render(<PreviousPosts initialPosts={null} />);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            // Should still show loading spinner because posts array remains empty
            expect(result.getByTestId('loading-spinner')).not.toBeNull();
        });
    });

    describe('Loading states', () => {
        it('should show loading spinner when posts array is empty', () => {
            const result = render(<PreviousPosts initialPosts={[]} />);
            expect(result.getByTestId('loading-spinner')).not.toBeNull();
        });

        it('should show posts and archive link when posts are available', () => {
            const initialPosts = [
                { entryId: '1', title: 'Post 1' },
                { entryId: '2', title: 'Post 2' }
            ];

            const result = render(<PreviousPosts initialPosts={initialPosts} />);

            expect(result.queryByTestId('loading-spinner')).toBeNull();
            expect(result.getByTestId('archive-link')).not.toBeNull();
        });
    });

    describe('Logging behavior verification', () => {
        it('should log exactly once on mount with initial posts', () => {
            const initialPosts = [
                { entryId: '1', title: 'Post 1' }
            ];

            render(<PreviousPosts initialPosts={initialPosts} />);

            // Should only log once for initial render
            const mountLogs = consoleLogSpy.mock.calls.filter(
                call => call[0].includes('Component rendered with')
            );
            expect(mountLogs.length).toBe(1);
        });

        it('should log all three stages when fetching from client side', async () => {
            mockGetEntries.mockResolvedValue([
                { entryId: '0', title: 'Hero Post' },
                { entryId: '1', title: 'Post 1' }
            ]);

            render(<PreviousPosts initialPosts={null} />);

            await waitFor(() => {
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    '[PreviousPosts] Component rendered with 0 initial posts'
                );
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    '[PreviousPosts] Fetching posts from client side'
                );
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    '[PreviousPosts] Successfully fetched 1 posts'
                );
            });

            // Should have exactly 3 log calls with [PreviousPosts] prefix
            const previousPostsLogs = consoleLogSpy.mock.calls.filter(
                call => call[0].includes('[PreviousPosts]')
            );
            expect(previousPostsLogs.length).toBe(3);
        });
    });
});
