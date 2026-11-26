// ABOUTME: Tests for the fixed, full-page background behind a single post.
// ABOUTME: It's the post's hero image or map (else the homepage's image), sized to the screen and fetched last.
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostBackground from '@/components/PostBackground';

let mockImageRoot = '/images/';
const MAP_URL = 'https://maps.googleapis.com/maps/api/staticmap?size=630x290';

jest.mock('@/lib/SiteConfig', () => {
    return class {
        getValue(key, post) {
            return `${mockImageRoot}${post.imageFileName}`;
        }

        getEndpoint(key, values) {
            return `/endpoint/${key}/${values.fileName}`;
        }
    };
});

jest.mock('@/components/PostBackground.module.scss', () => ({ background: 'background', image: 'image' }));

function backgroundImage() {
    return screen.getByTestId('post-background').querySelector('img');
}

beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(MAP_URL) });
});

afterEach(() => {
    jest.restoreAllMocks();
    mockImageRoot = '/images/';
});

test('uses the hero image as the background', () => {
    render(<PostBackground post={{ imageFileName: 'hero.jpg', imageFileType: 'image' }}/>);

    expect(backgroundImage()).toHaveAttribute('src', '/images/hero.jpg');
});

test('serves a CDN hero through the image optimizer, sized to the screen', () => {
    mockImageRoot = 'https://raserio.b-cdn.net/';
    render(<PostBackground post={{ imageFileName: 'hero.jpg', imageFileType: 'image' }}/>);

    expect(backgroundImage().getAttribute('src')).toMatch(/^\/_next\/image\?url=/);
    expect(backgroundImage().getAttribute('src')).toContain(encodeURIComponent('https://raserio.b-cdn.net/hero.jpg'));
    expect(backgroundImage()).toHaveAttribute('sizes', '100vw');
});

test('is fetched after the post\'s own images, so it never delays them', () => {
    render(<PostBackground post={{ imageFileName: 'hero.jpg', imageFileType: 'image' }}/>);

    expect(backgroundImage()).toHaveAttribute('fetchpriority', 'low');
    expect(backgroundImage()).toHaveAttribute('loading', 'lazy');
});

test('uses the map as the background when the hero is a GPX track', async () => {
    render(<PostBackground post={{ imageFileName: 'ride.gpx', imageFileType: 'image' }}/>);

    await waitFor(() => expect(backgroundImage()).toHaveAttribute('src', MAP_URL));
    expect(global.fetch).toHaveBeenCalledWith('/endpoint/maps.mapimageuri/ride.gpx');
});

test('uses the homepage background when the post has no hero image', () => {
    render(<PostBackground post={{ imageFileName: null, imageFileType: null }}/>);

    expect(backgroundImage()).toHaveAttribute('src', '/img/gold-rush-desktop.jpg');
    expect(global.fetch).not.toHaveBeenCalled();
});

test('uses the homepage background when the map cannot be found', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('Not Found') });

    render(<PostBackground post={{ imageFileName: 'missing.gpx', imageFileType: 'image' }}/>);

    await waitFor(() => expect(backgroundImage()).toHaveAttribute('src', '/img/gold-rush-desktop.jpg'));
});

test('renders nothing until the map location arrives', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    const { container } = render(<PostBackground post={{ imageFileName: 'ride.gpx', imageFileType: 'image' }}/>);

    expect(container).toBeEmptyDOMElement();
});
