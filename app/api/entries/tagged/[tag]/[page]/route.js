// ABOUTME: GET /api/entries/tagged/[tag]/[page] - returns one page of the posts with a tag, newest first.
// ABOUTME: Query param: pageSize (default 10). Page number is zero-indexed.

import { NextResponse } from 'next/server';
import PostRepository from '@/lib/data/PostRepository';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Tags can hold characters like "&" and "/", which the client URL-encodes. Decode them here,
 * leaving a segment that isn't valid percent-encoding as it is.
 */
function decodeTag(tag) {
    try {
        return decodeURIComponent(tag);
    } catch {
        return tag;
    }
}

export async function GET(request, { params }) {
    const parsedPage = parseInt(params.page, 10);
    const page = isNaN(parsedPage) ? 0 : parsedPage;
    const pageSize = parseInt(new URL(request.url).searchParams.get('pageSize'), 10) || DEFAULT_PAGE_SIZE;
    const posts = await PostRepository.getInstance().getEntriesByTag(decodeTag(params.tag), page, pageSize);
    return NextResponse.json(posts);
}
