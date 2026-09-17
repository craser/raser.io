// ABOUTME: GET /rss - renders the twenty newest blog entries as an RSS 2.0 feed.
// ABOUTME: Reads posts straight from the database so the feed never calls back into the site's own API.

import { NextResponse, NextRequest } from "next/server";
import PostRepository from "@/lib/data/PostRepository";

import SiteConfig from "@/lib/SiteConfig";
import { getAbsoluteUrl, getPostLink } from "@/lib/util/Links";

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
                <link>${new SiteConfig().getValue('site.url')}</link>
                <description>Chris Raser's Personal Blog</description>
                <language>en-us</language>
                ${postsXml}
              </channel>
            </rss>`
        );
}

function renderPosts() {
    return PostRepository.getInstance().getEntries(0, 20)
        .then(posts => posts.map(post => {
                const link = getAbsoluteUrl(getPostLink(post));
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
