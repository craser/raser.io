// ABOUTME: GET /api/maps/mapimageuri/[fileName] - returns the URL of a map image of a GPX track.
// ABOUTME: Reads the GPX from the CDN, thins the track, and hands back the image URL as text.

import { NextResponse } from 'next/server';
import SiteConfig from '@/lib/SiteConfig';
import { parseTracks } from '@/lib/maps/GpxParser';
import { thinTrack } from '@/lib/maps/TrackReducer';
import { getTrackMapUrl } from '@/lib/maps/TrackMapUrl';

/** The legacy implementation drew the first track in the file, and so does this. */
const TRACK_INDEX = 0;

/** Thinning stops at the point budget rather than at a deviation threshold. */
const MIN_DEVIATION_METERS = 0;

function textResponse(body, cacheSeconds) {
    return new NextResponse(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': `public, max-age=${cacheSeconds}`
        }
    });
}

export async function GET(request, { params }) {
    const config = new SiteConfig();
    const cacheSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds');
    const gpxUrl = config.getValue('maps.gpxSource', { fileName: params.fileName });

    let gpx;
    try {
        const response = await fetch(gpxUrl, { next: { revalidate: cacheSeconds } });
        if (!response.ok) {
            console.error(`Unable to read map data from ${gpxUrl}: ${response.status}`);
            return new NextResponse(null, { status: response.status === 404 ? 404 : 502 });
        }
        gpx = await response.text();
    }
    catch (error) {
        console.error(`Unable to reach ${gpxUrl}:`, error);
        return new NextResponse(null, { status: 502 });
    }

    try {
        const track = parseTracks(gpx)[TRACK_INDEX];
        if (!track || track.length < 1) {
            console.error(`No track points found in ${params.fileName}.`);
            return new NextResponse(null, { status: 502 });
        }

        const maxPoints = config.getValue('maps.maxPathPoints');
        const url = getTrackMapUrl(thinTrack(track, maxPoints, MIN_DEVIATION_METERS), {
            apiKey: config.getValue('maps.googleApiKey')
        });

        return textResponse(url, cacheSeconds);
    }
    catch (error) {
        console.error(`Unable to build a map image URL for ${params.fileName}:`, error);
        return new NextResponse(null, { status: 502 });
    }
}
