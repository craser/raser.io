// ABOUTME: GET /api/maps/mapimageuri/[fileName] - returns the URL of a map image of a GPX track.
// ABOUTME: Serves the CDN's copy, rendering and storing one the first time it is asked for.

import { NextResponse } from 'next/server';
import SiteConfig from '@/lib/SiteConfig';
import MapImageStore from '@/lib/maps/MapImageStore';
import { parseTracks } from '@/lib/maps/GpxParser';
import { thinTrack } from '@/lib/maps/TrackReducer';
import { getTrackMapUrl } from '@/lib/maps/TrackMapUrl';

/** The legacy implementation drew the first track in the file, and so does this. */
const TRACK_INDEX = 0;

/** Thinning stops at the point budget rather than at a deviation threshold. */
const MIN_DEVIATION_METERS = 0;

const IMAGE_CONTENT_TYPE = 'image/jpeg';

/** The name becomes a path in the image store, so it may not wander out of it. */
const STORABLE_NAME = /^[\w.-]+$/;

function toImageName(fileName) {
    return `${fileName.replace(/\.gpx$/i, '')}.jpg`;
}

/**
 * Map image URLs are protocol-relative so the browser matches them to the page,
 * but fetching one here needs a protocol of its own.
 */
function toFetchable(url) {
    return url.startsWith('//') ? `https:${url}` : url;
}

function textResponse(body, cacheSeconds) {
    return new NextResponse(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': `public, max-age=${cacheSeconds}`
        }
    });
}

/**
 * Renders the map image URL from the track's GPX.
 * @returns {Promise<{url?: string, failure?: number}>} the URL, or a status to respond with
 */
async function renderMapUrl(config, fileName, cacheSeconds) {
    const gpxUrl = config.getValue('maps.gpxSource', { fileName });

    let gpx;
    try {
        const response = await fetch(gpxUrl, { next: { revalidate: cacheSeconds } });
        if (!response.ok) {
            console.error(`Unable to read map data from ${gpxUrl}: ${response.status}`);
            return { failure: response.status === 404 ? 404 : 502 };
        }
        gpx = await response.text();
    }
    catch (error) {
        console.error(`Unable to reach ${gpxUrl}:`, error);
        return { failure: 502 };
    }

    try {
        const track = parseTracks(gpx)[TRACK_INDEX];
        if (!track || track.length < 1) {
            console.error(`No track points found in ${fileName}.`);
            return { failure: 502 };
        }

        const maxPoints = config.getValue('maps.maxPathPoints');
        const url = getTrackMapUrl(thinTrack(track, maxPoints, MIN_DEVIATION_METERS), {
            apiKey: config.getValue('maps.googleApiKey')
        });
        return { url };
    }
    catch (error) {
        console.error(`Unable to build a map image URL for ${fileName}:`, error);
        return { failure: 502 };
    }
}

async function fetchImage(mapUrl) {
    const response = await fetch(toFetchable(mapUrl));
    if (!response.ok) {
        throw new Error(`Map image request failed: ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
}

export async function GET(request, { params }) {
    const { fileName } = params;
    if (!STORABLE_NAME.test(fileName)) {
        console.error(`Refusing to handle map image name: ${fileName}`);
        return new NextResponse(null, { status: 400 });
    }

    const config = new SiteConfig();
    const cacheSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds');
    const store = MapImageStore.getInstance();
    const imageName = toImageName(fileName);

    // Answering from the store costs one request, so it comes before reading the track.
    let storeUsable = true;
    try {
        if (await store.exists(imageName)) {
            return textResponse(store.getPublicUrl(imageName), cacheSeconds);
        }
    }
    catch (error) {
        console.error(`Unable to reach the map image store for ${imageName}:`, error);
        storeUsable = false;
    }

    const { url, failure } = await renderMapUrl(config, fileName, cacheSeconds);
    if (failure) {
        return new NextResponse(null, { status: failure });
    }

    // With nowhere to keep a copy, let the browser load it from the map service.
    if (!storeUsable) {
        return textResponse(url, cacheSeconds);
    }

    let image;
    try {
        image = await fetchImage(url);
    }
    catch (error) {
        console.error(`Unable to render a map image for ${fileName}:`, error);
        return new NextResponse(null, { status: 502 });
    }

    try {
        await store.save(imageName, image, IMAGE_CONTENT_TYPE);
        return textResponse(store.getPublicUrl(imageName), cacheSeconds);
    }
    catch (error) {
        console.error(`Unable to store the map image for ${fileName}:`, error);
        return textResponse(url, cacheSeconds);
    }
}
