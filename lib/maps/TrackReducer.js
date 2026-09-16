// ABOUTME: Thins a GPS track to a point budget, keeping the points that shape the route.
// ABOUTME: Repeatedly splits whichever span strays furthest from its own straight line.

import { metersBetween, bearingBetween } from '@/lib/maps/GpsMath';

/**
 * Perpendicular distance from a point to the segment's line, given the
 * segment's bearing, the bearing to the point, and the distance to it.
 */
function distanceToLine(segmentBearing, pointBearing, pointDistance) {
    const angle = Math.abs(pointBearing - segmentBearing) % Math.PI;
    const acute = (angle > (0.5 * Math.PI)) ? (Math.PI - angle) : angle;
    return pointDistance * Math.sin(acute);
}

/**
 * A span of the track between two indexes, scored by how far its most
 * wayward interior point strays from the straight line between its ends.
 * A span with nothing between its ends scores zero and cannot be split.
 */
function toSpan(track, start, end) {
    const origin = track[start];
    const segmentBearing = bearingBetween(origin, track[end]);

    let interest = 0;
    let waywardIndex = start;

    for (let i = start + 1; i < end; i++) {
        const point = track[i];
        const distance = distanceToLine(
            segmentBearing,
            bearingBetween(origin, point),
            metersBetween(origin, point)
        );
        if (distance > interest) {
            interest = distance;
            waywardIndex = i;
        }
    }

    return { start, end, interest, waywardIndex, splittable: (end - start) > 1 };
}

function split(track, span) {
    return [
        toSpan(track, span.start, span.waywardIndex),
        toSpan(track, span.waywardIndex, span.end)
    ];
}

function mostWayward(spans) {
    return spans.reduce((best, span) => (span.interest > best.interest ? span : best));
}

/**
 * @param track array of { latitude, longitude } points
 * @param maxPoints the most points the result may contain
 * @param minDistance stop splitting once no span strays this far, in meters
 * @returns a new array holding a subset of the original points, in order
 */
export function thinTrack(track, maxPoints, minDistance) {
    if (track.length <= 2) {
        return [...track];
    }

    let spans = [toSpan(track, 0, track.length - 1)];

    // Every span contributes its start point, and the last one also contributes its end.
    while (spans.length < (maxPoints - 1)) {
        const span = mostWayward(spans);
        if (!span.splittable || span.interest < minDistance) {
            break;
        }
        spans = spans.flatMap(s => (s === span ? split(track, s) : s));
    }

    return spans.map(span => track[span.start]).concat(track[spans[spans.length - 1].end]);
}
