
import { init, track } from '@amplitude/analytics-node';
import { GET } from '@/app/pixel/route';

jest.mock('next/server', () => ({
    NextResponse: jest.fn()
}));

jest.mock('@amplitude/analytics-node');

describe('Tracking Pixel', () => {

   it('should fire a pixel event', async () => {
       await GET();
       expect(track).toHaveBeenCalledWith('pixel');
   });

});
