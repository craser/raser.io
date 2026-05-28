// ABOUTME: GET /api/entries/[id] — returns a single blog entry by entryId.
// ABOUTME: Returns 404 if the entry does not exist.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const post = BlogData.getInstance().getPostById(params.id);
    if (!post) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(post);
}
