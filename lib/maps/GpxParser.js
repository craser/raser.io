// ABOUTME: Extracts track point coordinates from a GPX document.
// ABOUTME: Returns one array of { latitude, longitude } points per <trk> element.

/** Matches a whole <trk> element, so waypoints and route points are left out. */
const TRACK_PATTERN = /<trk>([\s\S]*?)<\/trk>/g;

/** Matches a <trkpt> start tag and captures its attribute list. */
const TRACK_POINT_PATTERN = /<trkpt\s+([^>]*?)\/?>/g;

const LATITUDE_PATTERN = /\blat\s*=\s*"([^"]*)"/;
const LONGITUDE_PATTERN = /\blon\s*=\s*"([^"]*)"/;

function toPoint(attributes) {
    const latitude = LATITUDE_PATTERN.exec(attributes);
    const longitude = LONGITUDE_PATTERN.exec(attributes);
    if (!latitude || !longitude) {
        return null;
    }
    return {
        latitude: Number(latitude[1]),
        longitude: Number(longitude[1])
    };
}

function toTrack(trackXml) {
    const points = [];
    for (const match of trackXml.matchAll(TRACK_POINT_PATTERN)) {
        const point = toPoint(match[1]);
        if (point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) {
            points.push(point);
        }
    }
    return points;
}

/**
 * @param xml a GPX document
 * @returns {Array<Array<{latitude: number, longitude: number}>>} one entry per track
 */
export function parseTracks(xml) {
    return Array.from(xml.matchAll(TRACK_PATTERN)).map(match => toTrack(match[1]));
}
