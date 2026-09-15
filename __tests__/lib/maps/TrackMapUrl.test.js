// ABOUTME: Tests for building the static map image URL that renders a GPS track.
// ABOUTME: Covers sizing, coordinate formatting, and the Static Maps URL length ceiling.

import fs from 'fs';
import path from 'path';
import { getTrackMapUrl } from '@/lib/maps/TrackMapUrl';
import { parseTracks } from '@/lib/maps/GpxParser';
import { thinTrack } from '@/lib/maps/TrackReducer';

const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures/track.gpx'), 'utf8');
const API_KEY = 'AIzaSyBOUra7aNY509z2Z8mitJjK4FUpU_oOy1A';
const TRACK = [
    { latitude: 34.279420367, longitude: -118.682825044 },
    { latitude: 34.28, longitude: -118.68 }
];

function urlFor(track, options) {
    return getTrackMapUrl(track, { apiKey: API_KEY, ...options });
}

test('renders a postcard sized map by default', () => {
    expect(urlFor(TRACK)).toContain('size=630x290');
});

test('renders a thumbnail sized map on request', () => {
    expect(urlFor(TRACK, { size: 'thumbnail' })).toContain('size=20x20');
});

test('rejects a size it has no dimensions for', () => {
    expect(() => urlFor(TRACK, { size: 'billboard' })).toThrow(/billboard/);
});

test('defaults to a terrain map in jpg', () => {
    const url = urlFor(TRACK);

    expect(url).toContain('maptype=terrain');
    expect(url).toContain('format=jpg');
});

test('includes the api key', () => {
    expect(urlFor(TRACK)).toContain(`key=${API_KEY}`);
});

test('requests the image over https', () => {
    expect(urlFor(TRACK).startsWith('https://maps.googleapis.com/maps/api/staticmap?')).toBe(true);
});

test('draws the track as a red path', () => {
    expect(urlFor(TRACK)).toContain('path=color:0xFF0000BF|weight:3|');
});

test('rounds coordinates to four decimal places', () => {
    expect(urlFor(TRACK)).toContain('34.2794,-118.6828');
});

test('leaves off trailing zeros so the url stays short', () => {
    expect(urlFor(TRACK)).toContain('34.28,-118.68');
});

test('separates points with a pipe rather than an escape sequence', () => {
    expect(urlFor(TRACK)).toContain('34.2794,-118.6828|34.28,-118.68');
    expect(urlFor(TRACK)).not.toContain('%7C');
});

test('stays under the 2048 character static maps limit for a full track', () => {
    const track = thinTrack(parseTracks(FIXTURE)[0], 85, 0);

    expect(urlFor(track).length).toBeLessThan(2048);
});

test('rejects a track with no points', () => {
    expect(() => urlFor([])).toThrow();
});
