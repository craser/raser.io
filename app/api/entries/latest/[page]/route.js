// ABOUTME: GET /api/entries/latest/[page] - returns one page of blog entries, newest first.
// ABOUTME: Query param: pageSize (default 10). Page number is zero-indexed.

import { NextResponse } from 'next/server';
import PostRepository from '@/lib/data/PostRepository';

const DEFAULT_PAGE_SIZE = 10;

export async function GET(request, { params }) {
    const parsedPage = parseInt(params.page, 10);
    const page = isNaN(parsedPage) ? 0 : parsedPage;
    const pageSize = parseInt(new URL(request.url).searchParams.get('pageSize'), 10) || DEFAULT_PAGE_SIZE;
    const posts = await PostRepository.getInstance().getEntries(page, pageSize);
    return NextResponse.json(posts);
}
