// ABOUTME: Tests for extracting track point coordinates out of GPX documents.
// ABOUTME: Covers segment flattening, multiple tracks, and ignoring non-track points.

import fs from 'fs';
import path from 'path';
import { parseTracks } from '@/lib/maps/GpxParser';

const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures/track.gpx'), 'utf8');

function gpx(body) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.0" xmlns="http://www.topografix.com/GPX/1/0">${body}</gpx>`;
}

test('reads latitude and longitude as numbers', () => {
    const tracks = parseTracks(gpx(`
        <trk><trkseg>
            <trkpt lat="34.279420367" lon="-118.682825044"><ele>331.3</ele></trkpt>
        </trkseg></trk>`));

    expect(tracks).toEqual([[{ latitude: 34.279420367, longitude: -118.682825044 }]]);
});

test('flattens multiple segments into a single track', () => {
    const tracks = parseTracks(gpx(`
        <trk>
            <trkseg><trkpt lat="1" lon="2"></trkpt></trkseg>
            <trkseg><trkpt lat="3" lon="4"></trkpt></trkseg>
        </trk>`));

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toHaveLength(2);
});

test('keeps separate tracks separate, in document order', () => {
    const tracks = parseTracks(gpx(`
        <trk><trkseg><trkpt lat="1" lon="2"></trkpt></trkseg></trk>
        <trk><trkseg>
            <trkpt lat="3" lon="4"></trkpt>
            <trkpt lat="5" lon="6"></trkpt>
        </trkseg></trk>`));

    expect(tracks.map(t => t.length)).toEqual([1, 2]);
    expect(tracks[0][0].latitude).toBe(1);
    expect(tracks[1][0].latitude).toBe(3);
});

test('ignores waypoints and route points outside a track', () => {
    const tracks = parseTracks(gpx(`
        <wpt lat="10" lon="20"><name>Trailhead</name></wpt>
        <rte><rtept lat="30" lon="40"></rtept></rte>
        <trk><trkseg><trkpt lat="1" lon="2"></trkpt></trkseg></trk>`));

    expect(tracks).toEqual([[{ latitude: 1, longitude: 2 }]]);
});

test('accepts lon before lat', () => {
    const tracks = parseTracks(gpx('<trk><trkseg><trkpt lon="-118.5" lat="34.5"/></trkseg></trk>'));

    expect(tracks[0][0]).toEqual({ latitude: 34.5, longitude: -118.5 });
});

test('returns no tracks for a document without any', () => {
    expect(parseTracks(gpx('<wpt lat="10" lon="20"></wpt>'))).toEqual([]);
});

test('reads every point of a real GPX export', () => {
    const tracks = parseTracks(FIXTURE);

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toHaveLength(200);
    expect(tracks[0][0]).toEqual({ latitude: 34.279420367, longitude: -118.682825044 });
    tracks[0].forEach(point => {
        expect(Number.isFinite(point.latitude)).toBe(true);
        expect(Number.isFinite(point.longitude)).toBe(true);
    });
});
