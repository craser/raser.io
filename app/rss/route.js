import { NextResponse, NextRequest } from "next/server";
import PostDao from "@/model/PostDao";

import { getPostLink } from "@/lib/util/Links";

/**
 *
 * @param request {NextRequest}
 * @returns {NextResponse<{derp: string}>}
 * @constructor
 */
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
    const dao = PostDao.getPostDao();
    return dao.getEntries(0, 20)
        .then(posts => posts.map(post => {
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
            })
                .join('')
        )
        .catch(err => {
            console.error(err);
            return '';
        })
}
