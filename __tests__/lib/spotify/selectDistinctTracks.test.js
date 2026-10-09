// ABOUTME: Tests for reducing a newest-first play history to its most recent distinct tracks.
// ABOUTME: Pure function; no mocks.

import selectDistinctTracks from '@/lib/spotify/selectDistinctTracks';

const tracks = (...ids) => ids.map((id) => ({ id, title: `title ${id}` }));
const ids = (list) => list.map((t) => t.id);

describe('selectDistinctTracks', () => {
    test('keeps each track once, at the position of its most recent play', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'b', 'a', 'c', 'b'), 12))).toEqual(['a', 'b', 'c']);
    });

    test('stops at the limit', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'b', 'c', 'd'), 2))).toEqual(['a', 'b']);
    });

    test('counts distinct tracks, not plays, toward the limit', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'a', 'a', 'b', 'c'), 2))).toEqual(['a', 'b']);
    });

    test('returns fewer than the limit when history is short, e.g. one song on repeat', () => {
        expect(ids(selectDistinctTracks(tracks('a', 'a', 'a'), 12))).toEqual(['a']);
    });

    test('empty history gives an empty list', () => {
        expect(selectDistinctTracks([], 12)).toEqual([]);
    });

    test('returns the track objects themselves', () => {
        const history = tracks('a');
        expect(selectDistinctTracks(history, 12)[0]).toBe(history[0]);
    });
});
