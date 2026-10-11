// ABOUTME: Tests for the fixed, full-page background behind a single post.
// ABOUTME: The background is the post's hero image, or its map when the hero is a GPX track.
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

test('renders nothing when the post has no hero image', () => {
    const { container } = render(<PostBackground post={{ imageFileName: null, imageFileType: null }}/>);

    expect(container).toBeEmptyDOMElement();
    expect(global.fetch).not.toHaveBeenCalled();
});

test('renders nothing until the map location arrives', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    const { container } = render(<PostBackground post={{ imageFileName: 'ride.gpx', imageFileType: 'image' }}/>);

    expect(container).toBeEmptyDOMElement();
});
