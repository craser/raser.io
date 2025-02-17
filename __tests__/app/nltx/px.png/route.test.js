import { track } from '@amplitude/analytics-node';
import { useRouter } from 'next/router';
import { GET } from '@/app/nltx/px.png/route';

jest.mock('next/server', () => ({
    NextResponse: jest.fn()
}));

jest.mock('@amplitude/analytics-node');
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

describe('Tracking Pixel', () => {

    beforeEach(() => {
        jest.resetAllMocks();
        track.mockReturnValue({
            promise: Promise.resolve({})
        });
        useRouter.mockReturnValue({
            query: {
                version: 'VERSION',
                source: 'SOURCE',
            }
        });
    });

    it('should pass request parameters through to anlytics event', async () => {
        const request = {
            nextUrl: {
                searchParams: {
                    foo: 'bar',
                    bim: 'gregory'
                }
            }
        }
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
});
