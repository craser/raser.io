// ABOUTME: GET /api/entries/[id] - returns a single blog entry by entryId.
// ABOUTME: Returns 404 if the entry does not exist.

import { NextResponse } from 'next/server';
import PostRepository from '@/lib/data/PostRepository';

export async function GET(request, { params }) {
    const post = await PostRepository.getInstance().getPostById(params.id);
    if (!post) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(post);
}
