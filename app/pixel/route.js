import { NextResponse } from "next/server";
import { init, track } from '@amplitude/analytics-node';
import { promises as fs } from 'fs';
import path from 'path';
import SiteConfig from "@/lib/SiteConfig";

export async function GET(request) {
    const siteConfig = new SiteConfig();
    const apiKey = siteConfig.getValue('amplitude.apiKey');
    const options = siteConfig.getValue('amplitude.server.options');
    init(apiKey);

    track('pixel');

    // Read the file from the public directory
    const filePath = path.join(process.cwd(), 'public', 'analytics', 'px.png');
    const fileBuffer = await fs.readFile(filePath);

    // Return the file as a response
    return new NextResponse(fileBuffer, {
        status: 200,
        headers: { 'Content-Type': 'image/png' }
    });
}
