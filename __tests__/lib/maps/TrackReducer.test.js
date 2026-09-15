// ABOUTME: Tests for thinning a GPS track down to a point budget.
// ABOUTME: Verifies the budget, endpoint preservation, ordering, and which points survive.

import fs from 'fs';
import path from 'path';
import { thinTrack } from '@/lib/maps/TrackReducer';
import { parseTracks } from '@/lib/maps/GpxParser';

const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures/track.gpx'), 'utf8');

/** A due-west line from A to B, with two points off it: P2 deviates ~10x further than P1. */
const A = { latitude: 34.0, longitude: -118.0 };
const P1 = { latitude: 34.0001, longitude: -118.002 };
const P2 = { latitude: 34.001, longitude: -118.005 };
const B = { latitude: 34.0, longitude: -118.01 };

test('keeps the whole track when it already fits the budget', () => {
    const track = [A, P1, P2, B];

    expect(thinTrack(track, 85, 0)).toEqual(track);
});

test('keeps the point that strays furthest from the straight line', () => {
    const thinned = thinTrack([A, P1, P2, B], 3, 0);

    expect(thinned).toEqual([A, P2, B]);
});

test('keeps only the endpoints when no point strays past the minimum distance', () => {
    const thinned = thinTrack([A, P1, P2, B], 85, 100000);

    expect(thinned).toEqual([A, B]);
});

describe('thinning a real 200 point track to 85 points', () => {
    const track = parseTracks(FIXTURE)[0];
    const thinned = thinTrack(track, 85, 0);

    test('spends exactly the point budget', () => {
        expect(thinned).toHaveLength(85);
    });

    test('keeps the first and last point of the original', () => {
        expect(thinned[0]).toEqual(track[0]);
        expect(thinned[thinned.length - 1]).toEqual(track[track.length - 1]);
    });

    test('keeps the points in their original order', () => {
        const positions = thinned.map(point => track.indexOf(point));
        const ascending = [...positions].sort((a, b) => a - b);

        expect(positions).toEqual(ascending);
    });

    test('keeps only points that were in the original track', () => {
        thinned.forEach(point => expect(track).toContain(point));
    });

    test('contains no duplicate points', () => {
        expect(new Set(thinned).size).toBe(thinned.length);
    });
});

test('handles a track too short to split', () => {
    expect(thinTrack([A, B], 85, 0)).toEqual([A, B]);
});
