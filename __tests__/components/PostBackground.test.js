// ABOUTME: Tests for the fixed, full-page background behind a single post.
// ABOUTME: The background is the post's hero image or map, falling back to the homepage's image.
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostBackground from '@/components/PostBackground';

const MAP_URL = 'https://maps.googleapis.com/maps/api/staticmap?size=630x290';

jest.mock('@/lib/SiteConfig', () => {
    return class {
        getValue(key, post) {
            return `/images/${post.imageFileName}`;
        }

        getEndpoint(key, values) {
            return `/endpoint/${key}/${values.fileName}`;
        }
    };
});

jest.mock('@/components/PostBackground.module.scss', () => ({ background: 'background' }));

beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(MAP_URL) });
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('uses the hero image as the background', () => {
    render(<PostBackground post={{ imageFileName: 'hero.jpg', imageFileType: 'image' }}/>);

    expect(screen.getByTestId('post-background')).toHaveStyle('background-image: url(/images/hero.jpg)');
});

test('uses the map as the background when the hero is a GPX track', async () => {
    render(<PostBackground post={{ imageFileName: 'ride.gpx', imageFileType: 'image' }}/>);

    await waitFor(() => expect(screen.getByTestId('post-background'))
        .toHaveStyle(`background-image: url(${MAP_URL})`));
    expect(global.fetch).toHaveBeenCalledWith('/endpoint/maps.mapimageuri/ride.gpx');
});

test('uses the homepage background when the post has no hero image', () => {
    render(<PostBackground post={{ imageFileName: null, imageFileType: null }}/>);

    expect(screen.getByTestId('post-background')).toHaveStyle('background-image: url(/img/gold-rush-desktop.jpg)');
    expect(global.fetch).not.toHaveBeenCalled();
});

test('uses the homepage background when the map cannot be found', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('Not Found') });

    render(<PostBackground post={{ imageFileName: 'missing.gpx', imageFileType: 'image' }}/>);

    await waitFor(() => expect(screen.getByTestId('post-background'))
        .toHaveStyle('background-image: url(/img/gold-rush-desktop.jpg)'));
});

test('renders nothing until the map location arrives', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    const { container } = render(<PostBackground post={{ imageFileName: 'ride.gpx', imageFileType: 'image' }}/>);

    expect(container).toBeEmptyDOMElement();
});
