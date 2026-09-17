/**
 * ABOUTME: Integration tests for GET /rss against the real database.
 * ABOUTME: Confirms the feed is built in-process rather than by calling the site's own API.
 *
 * The environment pragma has to sit in this file's first docblock, so the ABOUTME
 * lines live here with it rather than in line comments above.
 *
 * @jest-environment node
 */

import { loadDatabaseEnv } from '../../support/database-env';

loadDatabaseEnv();

// These tests query the real database over the network, so allow well beyond Jest's
// five second default to absorb connection setup and parallel query load.
jest.setTimeout(30000);

import Database from '@/lib/data/Database';
import PostRepository from '@/lib/data/PostRepository';
import SiteConfig from '@/lib/SiteConfig';
import { GET } from '@/app/rss/route';

const SITE_URL = new SiteConfig().getValue('site.url');

afterAll(async () => {
    await Database.getInstance().close();
});

describe('GET /rss', () => {
    it('serves the feed as RSS XML', async () => {
        const response = await GET(new Request('http://localhost/rss'));
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/rss+xml');
    });

    it('renders an item for each of the twenty newest posts', async () => {
        const response = await GET(new Request('http://localhost/rss'));
        const xml = await response.text();
        expect(xml.match(/<item>/g)).toHaveLength(20);
    });

    it('renders the newest post title, link and publication date', async () => {
        const [newest] = await PostRepository.getInstance().getEntries(0, 1);
        const xml = await (await GET(new Request('http://localhost/rss'))).text();
        expect(xml).toContain(`<![CDATA[${newest.title}]]>`);
        expect(xml).toContain(`<link>${SITE_URL}/archive/${newest.entryId}</link>`);
        expect(xml).toContain(`<pubDate>${new Date(newest.datePosted).toUTCString()}</pubDate>`);
    });

    it('gives every item an absolute link and guid, which feed readers require', async () => {
        const xml = await (await GET(new Request('http://localhost/rss'))).text();
        const links = [...xml.matchAll(/<link>([^<]*)<\/link>/g)].map(m => m[1]);
        const guids = [...xml.matchAll(/<guid>([^<]*)<\/guid>/g)].map(m => m[1]);
        expect(guids).toHaveLength(20);
        expect(links.every(link => link.startsWith(`${SITE_URL}/`) || link === SITE_URL)).toBe(true);
        expect(guids.every(guid => guid.startsWith(`${SITE_URL}/archive/`))).toBe(true);
    });

    it('points the channel link at the configured site URL', async () => {
        const xml = await (await GET(new Request('http://localhost/rss'))).text();
        expect(xml).toContain(`<link>${SITE_URL}</link>`);
    });
});
