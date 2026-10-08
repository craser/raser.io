// ABOUTME: Reduces a newest-first play history to its most recent distinct tracks.
// ABOUTME: A track played several times appears once, where its most recent play was.

/**
 * @param {Track[]} tracks newest play first
 * @param {number} limit maximum number of tracks to return
 * @returns {Track[]}
 */
export default function selectDistinctTracks(tracks, limit) {
    const distinct = new Map();
    for (const track of tracks) {
        if (distinct.size === limit) {
            break;
        }
        if (!distinct.has(track.id)) {
            distinct.set(track.id, track);
        }
    }
    return [...distinct.values()];
}
