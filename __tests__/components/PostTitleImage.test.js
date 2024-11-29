import PostTitleImage from "@/components/PostTitleImage.jsx";
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useAnalytics } from "@/components/analytics/AnalyticsContext";

jest.mock('@/lib/SiteConfig', () => {
    return {
        SiteConfig: class {
            getValue(key, post) {
                return `proof/of/config/call/${post.imageFileName}`;
            }
        }
    };
});

jest.mock('@/components/analytics/AnalyticsContext');


describe('PostTitleImage', () => {
    beforeAll(() => {
        useAnalytics.mockReturnValue({
            fireEvent: jest.fn()
        });
    });

    it('should return an img tag with the expected url', async () => {
        const { container } = await render(<PostTitleImage post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toEqual('proof/of/config/call/test.jpg');
    });

    it('should signal analytics if the image fails to load', async () => {
        const { container } = await render(<PostTitleImage post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        const img = container.querySelector('img');
        img.dispatchEvent(new Event('error'));
        expect(useAnalytics().fireEvent).toHaveBeenCalled();
    });
});
