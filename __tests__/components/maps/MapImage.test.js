// ABOUTME: Tests for the component that renders a blog entry's GPX track as a map image.
// ABOUTME: The image source is fetched from the map image URI endpoint at render time.

import { MapImage } from '@/components/maps/MapImage';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const MAP_URL = 'https://maps.googleapis.com/maps/api/staticmap?size=630x290';

jest.mock('@/lib/SiteConfig', () => {
    return class {
        getEndpoint(key, values) {
            return `/endpoint/${key}/${values.fileName}`;
        }
    };
});

function endpointReturns(response) {
    global.fetch = jest.fn().mockResolvedValue(response);
}

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    endpointReturns({ ok: true, status: 200, text: () => Promise.resolve(MAP_URL) });
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('asks the endpoint for the given file', async () => {
    render(<MapImage fileName="ride.gpx"/>);

    await waitFor(() => expect(global.fetch)
        .toHaveBeenCalledWith('/endpoint/maps.mapimageuri/ride.gpx'));
});

test('shows the image the endpoint points at', async () => {
    render(<MapImage fileName="ride.gpx"/>);

    await waitFor(() => expect(screen.getByTestId('map-image')).toHaveAttribute('src', MAP_URL));
});

test('passes the class name through', async () => {
    render(<MapImage fileName="ride.gpx" className="titleimage"/>);

    expect(screen.getByTestId('map-image')).toHaveClass('titleimage');
});

test('shows no image when the endpoint reports a failure', async () => {
    endpointReturns({ ok: false, status: 404, text: () => Promise.resolve('Not Found') });

    render(<MapImage fileName="missing.gpx"/>);

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.getByTestId('map-image')).not.toHaveAttribute('src');
});

test('shows no image when the endpoint cannot be reached', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    render(<MapImage fileName="ride.gpx"/>);

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.getByTestId('map-image')).not.toHaveAttribute('src');
});

test('reports an image that fails to load', async () => {
    const onError = jest.fn();
    render(<MapImage fileName="ride.gpx" onError={onError}/>);

    screen.getByTestId('map-image').dispatchEvent(new Event('error'));

    expect(onError).toHaveBeenCalled();
});
