// ABOUTME: GET /api/entries/search/[numEntries] - returns compact search stubs for up to numEntries posts.
// ABOUTME: Used by the client-side search feature to build a local search index; cached at the CDN.

import { NextResponse } from 'next/server';
import PostRepository from '@/lib/data/PostRepository';

const DEFAULT_NUM_ENTRIES = 1000;

/**
 * The index only needs to be as fresh as the prerendered listings, which revalidate hourly.
 * Past that, the CDN serves the stale copy while it fetches a new one.
 */
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(request, props) {
    const params = await props.params;
    const parsed = parseInt(params.numEntries, 10);
    const numEntries = isNaN(parsed) ? DEFAULT_NUM_ENTRIES : parsed;
    const stubs = await PostRepository.getInstance().getSearchStubs(numEntries);
    return NextResponse.json(stubs, { headers: { 'Cache-Control': CACHE_CONTROL } });
}
