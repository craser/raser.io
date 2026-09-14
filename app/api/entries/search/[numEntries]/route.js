// ABOUTME: GET /api/entries/search/[numEntries] - returns up to numEntries post stubs.
// ABOUTME: Used by the client-side search feature to build a local search index.

import { NextResponse } from 'next/server';
import PostRepository from '@/lib/data/PostRepository';

const DEFAULT_NUM_ENTRIES = 1000;

export async function GET(request, { params }) {
    const parsed = parseInt(params.numEntries, 10);
    const numEntries = isNaN(parsed) ? DEFAULT_NUM_ENTRIES : parsed;
    const stubs = await PostRepository.getInstance().getSearchStubs(numEntries);
    return NextResponse.json(stubs);
}
