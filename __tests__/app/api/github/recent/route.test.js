jest.mock('octokit', () => ({
    Octokit: jest.fn()
}));

jest.mock('next/server', () => ({
    NextResponse: jest.fn()
}));

jest.mock('@/lib/SiteConfig', () => {
    return jest.fn().mockImplementation(() => ({
        getValue: jest.fn()
    }));
});

describe('/api/github/recent', () => {
    let mockOctokit;
    let NextResponse;
    let Octokit;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        NextResponse = require('next/server').NextResponse;
        Octokit = require('octokit').Octokit;

        mockOctokit = {
            rest: {
                repos: {
                    listForAuthenticatedUser: jest.fn().mockResolvedValue({ data: [] }),
                    listCommits: jest.fn().mockResolvedValue({ data: [] })
                }
            }
        };

        Octokit.mockImplementation(() => mockOctokit);
        NextResponse.mockImplementation((body, init) => ({
            body,
            status: init.status,
            headers: init.headers
        }));
    });

    it('should set Cache-Control header to 12 hours', async () => {
        const { GET } = require('@/app/api/github/recent/route');
        await GET();

        expect(NextResponse).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                status: 200,
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400'
                })
            })
        );
    });
});
