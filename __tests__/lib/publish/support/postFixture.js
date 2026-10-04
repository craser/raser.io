// ABOUTME: Builds throwaway post folders in the system temp directory for publisher tests.
// ABOUTME: Not a test file itself; the suite only runs files ending in .test.js.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function makePostFolder({ post = { title: 'My Trip' }, intro = '<p>Intro</p>\n', body = '', files = {} } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-post-'));
    if (post !== null) {
        const text = typeof post === 'string' ? post : JSON.stringify(post, null, 2);
        fs.writeFileSync(path.join(dir, 'post.json'), text);
    }
    if (intro !== null) {
        fs.writeFileSync(path.join(dir, 'intro.html'), intro);
    }
    if (body !== null) {
        fs.writeFileSync(path.join(dir, 'body.html'), body);
    }
    for (const [relativePath, content] of Object.entries(files)) {
        const target = path.join(dir, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
    }
    return dir;
}

export function removeFolder(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
}
