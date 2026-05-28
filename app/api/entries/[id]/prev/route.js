// ABOUTME: GET /api/entries/[id]/prev — returns the prev (chronologically older) blog entry.
// ABOUTME: Returns 404 if the given post is already the oldest.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const prev = BlogData.getInstance().getPrevPost(params.id);
    if (!prev) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(prev);
}
