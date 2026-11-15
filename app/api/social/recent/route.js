// ABOUTME: GET /api/social/recent - placeholder endpoint for recent social media activity.
// ABOUTME: Returns a fixed JSON message until a real social feed is wired in.

import { NextResponse } from "next/server";

// Generate this route once at build time, as a static file, rather than on every request.
export const dynamic = 'force-static';

export function GET(request) {
    const user = 'deathb4decaf';
    const fields = ['id', 'username', 'email', 'created_at', 'updated_at'];

    const data = {
        message: 'I want to be an Air Force Ranger!',
    }
    return Promise.resolve(new NextResponse(JSON.stringify(data), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    }))
}
