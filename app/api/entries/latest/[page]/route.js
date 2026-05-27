// ABOUTME: GET /api/entries/latest/[page] — returns one page of blog entries.
// ABOUTME: Query param: pageSize (default 10). Page number is zero-indexed.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const page = parseInt(params.page, 10) || 0;
    const pageSize = parseInt(new URL(request.url).searchParams.get('pageSize'), 10) || 10;
    return NextResponse.json(BlogData.getInstance().getEntries(page, pageSize));
}
