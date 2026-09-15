// ABOUTME: Great-circle distance and bearing between two latitude/longitude points.
// ABOUTME: Points are plain objects shaped { latitude, longitude } in decimal degrees.

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Haversine distance, in meters, ignoring elevation.
 */
export function metersBetween(a, b) {
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const dLat = lat2 - lat1;
    const dLon = toRadians(b.longitude - a.longitude);

    const n = (Math.sin(dLat / 2) * Math.sin(dLat / 2))
        + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2));
    const c = 2 * Math.atan2(Math.sqrt(n), Math.sqrt(1 - n));

    return EARTH_RADIUS_METERS * c;
}

/**
 * Initial bearing from a to b, in radians, measured clockwise from north.
 *
 * Track thinning only ever compares two bearings against each other, so the
 * sign convention cancels out there; this uses the conventional one so the
 * function stands on its own.
 */
export function bearingBetween(a, b) {
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const dLon = toRadians(b.longitude - a.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = (Math.cos(lat1) * Math.sin(lat2))
        - (Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon));

    return Math.atan2(y, x);
}
