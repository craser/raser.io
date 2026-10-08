/**
 * ABOUTME: Tests for the front page "Listening" section.
 * ABOUTME: Mocks global fetch and the lucide icon; renders the real PageSection.
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import RecentTracks from '@/components/spotify/RecentTracks';

jest.mock('lucide-react', () => ({
    Music: () => <b>music icon</b>
}));

const track = (id, overrides = {}) => ({
    id,
    title: `Title ${id}`,
    artists: ['Artist One', 'Artist Two'],
    url: `https://open.spotify.com/track/${id}`,
    albumImageUrl: `https://i.scdn.co/image/${id}`,
    ...overrides
});

function apiReturns(response) {
    global.fetch = jest.fn().mockResolvedValue(response);
}

describe('RecentTracks', () => {
    let consoleError;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    test('fetches the recent tracks endpoint', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [] }) });
        render(<RecentTracks/>);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/spotify/recent'));
    });

    test('renders a "Listening" section with a linked row per track', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [track('a'), track('b')] }) });
        render(<RecentTracks/>);

        expect(await screen.findByRole('heading', { name: 'Listening' })).toBeInTheDocument();
        const links = screen.getAllByRole('link');
        expect(links.map((l) => l.getAttribute('href'))).toEqual(['https://open.spotify.com/track/a', 'https://open.spotify.com/track/b']);
        expect(links[0]).toHaveTextContent('Title a');
        expect(links[0]).toHaveTextContent('Artist One, Artist Two');
    });

    test('shows each album thumbnail', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [track('a')] }) });
        const { container } = render(<RecentTracks/>);

        await screen.findByRole('heading', { name: 'Listening' });
        expect(container.querySelector('img').getAttribute('src')).toBe('https://i.scdn.co/image/a');
    });

    test('a track without album art renders without an image', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [track('a', { albumImageUrl: null })] }) });
        const { container } = render(<RecentTracks/>);

        await screen.findByRole('heading', { name: 'Listening' });
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByRole('link')).toHaveTextContent('Title a');
    });

    test('renders nothing while loading', () => {
        global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
        const { container } = render(<RecentTracks/>);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders nothing when there are no tracks', async () => {
        apiReturns({ ok: true, json: () => Promise.resolve({ tracks: [] }) });
        const { container } = render(<RecentTracks/>);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    test('renders nothing, and logs, when the API fails', async () => {
        apiReturns({ ok: false, status: 502, json: () => Promise.resolve({ error: 'Spotify is unavailable' }) });
        const { container } = render(<RecentTracks/>);

        await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Failed to fetch recent tracks: HTTP 502' })
        ));
        expect(container).toBeEmptyDOMElement();
    });
});
