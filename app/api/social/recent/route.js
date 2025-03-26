import { NextResponse } from "next/server";

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
