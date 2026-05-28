// ABOUTME: GET /api/entries/search/[numEntries] — returns up to numEntries post stubs.
// ABOUTME: Used by the client-side search feature to build a local search index.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const parsed = parseInt(params.numEntries, 10);
    const numEntries = isNaN(parsed) ? 1000 : parsed;
    return NextResponse.json(BlogData.getInstance().getSearchStubs(numEntries));
}
