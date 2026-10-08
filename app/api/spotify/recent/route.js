// ABOUTME: GET /api/spotify/recent: the tracks Chris most recently played on Spotify, for the front page.
// ABOUTME: Returns up to 12 distinct tracks cached for an hour, or an uncached 502 when Spotify can't be reached.

import { NextResponse } from "next/server";
import SiteConfig from "@/lib/SiteConfig";
import SpotifyClient from "@/lib/spotify/SpotifyClient";
import selectDistinctTracks from "@/lib/spotify/selectDistinctTracks";

const TRACK_LIMIT = 12;

// Caching is controlled by the Cache-Control header alone; never prerender this at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
    const config = new SiteConfig();
    const spotify = new SpotifyClient({
        clientId: config.getValue('spotify.clientId'),
        clientSecret: config.getValue('spotify.clientSecret'),
        refreshToken: config.getValue('spotify.refreshToken')
    });
    try {
        const tracks = selectDistinctTracks(await spotify.getRecentlyPlayedTracks(), TRACK_LIMIT);
        return new NextResponse(JSON.stringify({ tracks }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
            }
        });
    } catch (error) {
        console.error('Error fetching recently played tracks from Spotify:', error);
        return new NextResponse(JSON.stringify({ error: 'Spotify is unavailable' }), {
            status: 502,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    }
}
