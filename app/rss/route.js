// ABOUTME: RSS feed route — returns the 20 most recent blog entries as RSS 2.0 XML.
// ABOUTME: Reads directly from BlogData (server-side) without going through the HTTP API.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';
import { getPostLink } from '@/lib/util/Links';

export function GET(request) {
    return generateRss()
        .then(rss => new NextResponse(rss, {
            status: 200,
            headers: { 'Content-Type': 'application/rss+xml' }
        }));
}

function generateRss() {
    return renderPosts()
        .then(postsXml =>
            `<?xml version="1.0" encoding="UTF-8" ?>
            <rss version="2.0">
              <channel>
                <title>DeathB4Decaf</title>
                <link>https://raser.io</link>
                <description>Chris Raser's Personal Blog</description>
                <language>en-us</language>
                ${postsXml}
              </channel>
            </rss>`
        );
}

function renderPosts() {
    try {
        const posts = BlogData.getInstance().getEntries(0, 20);
        const postsXml = posts.map(post => {
            const link = getPostLink(post);
            return (
                `<item>
                  <title><![CDATA[${post.title}]]></title>
                  <link>${link}</link>
                  <description><![CDATA[${post.intro}]]></description>
                  <pubDate>${new Date(post.datePosted).toUTCString()}</pubDate>
                  <guid>${link}</guid>
                </item>`
            );
        }).join('');
        return Promise.resolve(postsXml);
    } catch (err) {
        console.error(err);
        return Promise.resolve('');
    }
}
