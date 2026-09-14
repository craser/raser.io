// ABOUTME: GET /api/entries/[id]/prev - returns the previous (chronologically older) blog entry.
// ABOUTME: Returns 404 if the given post is already the oldest.

import { NextResponse } from 'next/server';
import PostRepository from '@/lib/data/PostRepository';

export async function GET(request, { params }) {
    const prev = await PostRepository.getInstance().getPrevPost(params.id);
    if (!prev) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(prev);
}
