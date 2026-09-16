// ABOUTME: Tests for the great-circle distance and bearing helpers used to thin GPS tracks.
// ABOUTME: Expected values come from the standard haversine and forward-azimuth formulae.

import { metersBetween, bearingBetween } from '@/lib/maps/GpsMath';

const ORIGIN = { latitude: 0, longitude: 0 };

describe('metersBetween', () => {
    test('is zero for a point and itself', () => {
        expect(metersBetween(ORIGIN, ORIGIN)).toBe(0);
    });

    test('spans one degree of latitude in about 111195 meters', () => {
        const north = { latitude: 1, longitude: 0 };
        expect(metersBetween(ORIGIN, north)).toBeCloseTo(111194.93, 1);
    });

    test('gives the same distance in either direction', () => {
        const a = { latitude: 34.2794, longitude: -118.6828 };
        const b = { latitude: 34.2801, longitude: -118.6799 };
        expect(metersBetween(a, b)).toBeCloseTo(metersBetween(b, a), 9);
    });
});

describe('bearingBetween', () => {
    test('is zero heading due north', () => {
        expect(bearingBetween(ORIGIN, { latitude: 1, longitude: 0 })).toBeCloseTo(0, 9);
    });

    test('is a quarter turn heading due east', () => {
        expect(bearingBetween(ORIGIN, { latitude: 0, longitude: 1 })).toBeCloseTo(Math.PI / 2, 9);
    });

    test('is a negative quarter turn heading due west', () => {
        expect(bearingBetween(ORIGIN, { latitude: 0, longitude: -1 })).toBeCloseTo(-Math.PI / 2, 9);
    });
});
