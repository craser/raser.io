// ABOUTME: Builds the URL of a static map image showing a GPS track as a drawn path.
// ABOUTME: The only place that knows the image is served by the Google Static Maps API.

const BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap';

const PATH_STYLE = 'color:0xFF0000BF|weight:3';

/**
 * Named sizes, in pixels. These control the map image only; the thumbnail and
 * postcard sizes used for uploaded images are configured separately.
 */
const DIMENSIONS = {
    postcard: '630x290',
    thumbnail: '20x20'
};

const DEFAULT_SIZE = 'postcard';
const DEFAULT_MAP_TYPE = 'terrain';
const DEFAULT_FORMAT = 'jpg';

/** Four decimal places is roughly 11m, and keeps the path short enough to send. */
function toDegrees(value) {
    return Number(value.toFixed(4)).toString();
}

function toPathValue(track) {
    const points = track.map(p => `${toDegrees(p.latitude)},${toDegrees(p.longitude)}`);
    return `${PATH_STYLE}|${points.join('|')}`;
}

function getDimensions(size) {
    const dimensions = DIMENSIONS[size];
    if (!dimensions) {
        throw new Error(`Unrecognized size specifier: ${size}`);
    }
    return dimensions;
}

/**
 * Static Maps caps URLs at 2048 characters, and percent-encoding the separators
 * in the path parameter costs enough to push a full track past it. The query is
 * assembled by hand so the commas and pipes stay literal.
 *
 * @param track array of { latitude, longitude } points to draw
 * @param apiKey Google API key
 * @param size one of the named DIMENSIONS
 * @param mapType terrain, roadmap, satellite or hybrid
 * @param format image format, ex. jpg or png
 */
export function getTrackMapUrl(track, {
    apiKey,
    size = DEFAULT_SIZE,
    mapType = DEFAULT_MAP_TYPE,
    format = DEFAULT_FORMAT
}) {
    if (!track || track.length < 1) {
        throw new Error('Unable to build a map image URL: the track has no points.');
    }

    const query = [
        `size=${getDimensions(size)}`,
        `maptype=${mapType}`,
        `format=${format}`,
        `key=${apiKey}`,
        `path=${toPathValue(track)}`
    ].join('&');

    return `${BASE_URL}?${query}`;
}
