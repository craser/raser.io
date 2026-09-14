// ABOUTME: GET /api/entries/[id]/next - returns the next (chronologically newer) blog entry.
// ABOUTME: Returns 404 if the given post is already the newest.

import { NextResponse } from 'next/server';
import PostRepository from '@/lib/data/PostRepository';

export async function GET(request, { params }) {
    const next = await PostRepository.getInstance().getNextPost(params.id);
    if (!next) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(next);
}
