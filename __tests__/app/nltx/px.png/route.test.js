import { track } from '@amplitude/analytics-node';
import { useRouter } from 'next/router';
import { GET } from '@/app/nltx/px.png/route';

jest.mock('next/server', () => ({
    NextResponse: jest.fn()
}));

jest.mock('@amplitude/analytics-node');


function mockRequest() {
    const request = {
        referrer: 'DUMMY_REFERRER',
        headers: {
            get: jest.fn(() => 'DUMMY_USER_AGENT')
        },
        nextUrl: {
            searchParams: {
                foo: 'bar',
                bim: 'gregory'
            }
        }
    }
    return request;
}

describe('Tracking Pixel', () => {

    beforeEach(() => {
        jest.resetAllMocks();
        track.mockReturnValue({
            promise: Promise.resolve({})
        });
    });

    it('should pass request parameters through to anlytics event', async () => {
        const request = mockRequest();
        await GET(request);
        expect(track).toHaveBeenCalledWith(
            'pixel',
            expect.objectContaining({
                foo: 'bar',
                bim: 'gregory'
            }),
            expect.any(Object)
        );
    });

    it('should pass referrer and user agent from request', async () => {
        const request = mockRequest();
        await GET(request);
        expect(request.headers.get).toHaveBeenCalledWith('User-Agent');
            expect(track).toHaveBeenCalledWith(
            'pixel',
            expect.objectContaining({
                userAgent: 'DUMMY_USER_AGENT',
                referrer: 'DUMMY_REFERRER',
            }),
            expect.any(Object)
        );
    })
});
