import PostTitleImage from "@/components/PostTitleImage.jsx";
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

jest.mock('@/lib/SiteConfig', () => {
    return class {
        getValue(key, post) {
            return `https://raserio.b-cdn.net/proof/of/config/call/${post.imageFileName}`;
        }
    };
});

jest.mock('@/components/analytics/AnalyticsProvider');


describe('PostTitleImage', () => {
    beforeAll(() => {
        useAnalytics.mockReturnValue({
            fireImgFail: jest.fn(),
        });
    });

    it('should return an img tag that loads the configured url through the image optimizer', async () => {
        const { container } = await render(<PostTitleImage post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toMatch(/\/_next\/image\?url=/);
        expect(img.getAttribute('src')).toContain(encodeURIComponent('https://raserio.b-cdn.net/proof/of/config/call/test.jpg'));
    });

    it('should pass the sizes hint through, so previews download a smaller file', async () => {
        const { container } = await render(<PostTitleImage sizes="30vw" post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        expect(container.querySelector('img')).toHaveAttribute('sizes', '30vw');
    });

    it('should load the image lazily by default', async () => {
        const { container } = await render(<PostTitleImage post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    });

    it('should load the image straight away when asked to preload it', async () => {
        const { container } = await render(<PostTitleImage preload post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        expect(container.querySelector('img')).not.toHaveAttribute('loading');
    });

    it('should signal analytics if the image fails to load', async () => {
        const { container } = await render(<PostTitleImage post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        const img = container.querySelector('img');
        img.dispatchEvent(new Event('error'));
        expect(useAnalytics().fireImgFail).toHaveBeenCalled();
    });

    it('should reserve a fixed 3:2 box, so the page does not shift when the image loads', async () => {
        const { container } = await render(<PostTitleImage post={{
            imageFileName: 'test.jpg',
            imageFileType: 'image'
        }}/>);
        const img = container.querySelector('img');
        expect(img.getAttribute('width')).toEqual('1500');
        expect(img.getAttribute('height')).toEqual('1000');
    });
});
