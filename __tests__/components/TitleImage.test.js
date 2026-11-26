// ABOUTME: Tests the shared title image: CDN photos go through Next's optimizer at a size that fits
// ABOUTME: where they're shown, other sources are served as-is, and every one keeps the fixed 3:2 box.

import TitleImage, { POST_SIZES, PREVIEW_SIZES } from '@/components/TitleImage';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

const CDN_SRC = 'https://raserio.b-cdn.net/photo.jpg';

function renderImg(props) {
    const { container } = render(<TitleImage {...props}/>);
    return container.querySelector('img');
}

test('serves CDN photos through the image optimizer, not at full size', () => {
    const img = renderImg({ src: CDN_SRC, sizes: PREVIEW_SIZES });

    expect(img.getAttribute('src')).toMatch(/^\/_next\/image\?url=/);
    expect(img.getAttribute('src')).toContain(encodeURIComponent(CDN_SRC));
    expect(img.getAttribute('srcset')).toMatch(/\b640w\b/);
});

test('tells the browser how wide the image is drawn, so it picks a small enough file', () => {
    const img = renderImg({ src: CDN_SRC, sizes: PREVIEW_SIZES });

    expect(img).toHaveAttribute('sizes', PREVIEW_SIZES);
});

test('previews are asked for smaller than post title images', () => {
    expect(PREVIEW_SIZES).not.toEqual(POST_SIZES);
});

test('serves images from other hosts unchanged', () => {
    const src = 'https://maps.googleapis.com/maps/api/staticmap?size=630x290';
    const img = renderImg({ src });

    expect(img).toHaveAttribute('src', src);
});

test('reserves the fixed 3:2 box and keeps the caller\'s class', () => {
    const img = renderImg({ src: CDN_SRC, className: 'titleimage' });

    expect(img).toHaveAttribute('width', '1500');
    expect(img).toHaveAttribute('height', '1000');
    expect(img).toHaveClass('titleimage');
});

test('passes onError through, so failed loads still reach analytics', () => {
    const onError = jest.fn();
    const img = renderImg({ src: CDN_SRC, onError });

    img.dispatchEvent(new Event('error'));
    expect(onError).toHaveBeenCalled();
});
