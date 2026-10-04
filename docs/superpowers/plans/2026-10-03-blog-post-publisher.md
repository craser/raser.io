# Blog Post Publisher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A command-line tool, `npm run blog-post`, that scaffolds post folders (`--gen`) and publishes a post folder to production: uploading its files to the Bunny CDN and writing the post to CockroachDB.

**Architecture:** Small single-purpose modules in `lib/publish/` (folder reading, validation, link rewriting, record building, CDN client, upload planner, database writer, orchestrator, CLI helpers), each unit-tested with in-memory fakes. A thin entry point, `scripts/blog-post.js`, wires them together, re-launches itself under `op run` to obtain credentials, and prompts for confirmation.

**Tech Stack:** Node (plain ESM, run as `node scripts/blog-post.js`), `pg` (already a dependency), global `fetch`, Jest + babel-jest (existing setup), 1Password CLI (`op`).

**Spec:** `docs/superpowers/specs/2026-10-03-blog-post-publisher-design.md`

## Global Constraints

- No new npm dependencies.
- Files in `lib/publish/` and `scripts/` import each other with **relative paths ending in `.js`** (e.g. `import PublishError from './PublishError.js';`). Never `@/` — plain `node` cannot resolve it. Tests may import with `@/lib/publish/...` like the rest of the suite.
- Nothing in `lib/publish/` or `scripts/blog-post.js` reads `.env*` files or the app's variables (`DATABASE_URL`, `BUNNY_*`, `SiteConfig`). Credentials come only from `PUBLISH_DATABASE_URL`, `PUBLISH_BUNNY_STORAGE_HOST`, `PUBLISH_BUNNY_STORAGE_ZONE`, `PUBLISH_BUNNY_ACCESS_KEY`.
- `lib/publish/` code must run on Node 18 (CI uses Node 18): no `Array.prototype.toSorted`/`toReversed`, no `Set` methods like `union`.
- Every new source file starts with two `// ABOUTME:` lines describing it. Every new test file starts with a `/** ... */` docblock holding two `ABOUTME:` lines and `@jest-environment node` (see `__tests__/lib/maps/MapImageStore.test.js`).
- CI fails a PR whose statement coverage is lower than `main`'s. Everything in `lib/publish/` is unit tested; `scripts/blog-post.js` holds only wiring.
- CDN base URL: `https://raserio.b-cdn.net`. Fixed column values: `user_id = 1`, `user_name = 'Chris'`, `allow_comments = 'false'`, `syndicate = 'false'`.
- `datePosted` format in `post.json`: `YYYY-MM-DD HH:MM`, local time. Database timestamps are written as local-time strings (`YYYY-MM-DD HH:MM:SS`) cast with `::TIMESTAMP`.
- Commit messages start with `BLOG-POST-PUBLISHER:` and end with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `jest.setup.js` replaces `console.*` with mocks; tests must not rely on console output — inject a `log` function instead.

## Review Focus

1. **macOS junk files** (`.DS_Store`, any dotfile or dot-folder) inside `images/` or `docs/` — must be ignored, never uploaded or recorded. Test: Task 2, "ignores dotfiles".
2. **File names with spaces or non-ASCII characters** — an HTML reference written percent-encoded (`images/my%20photo.jpg`) must still match the file; the rewritten CDN URL and the storage upload URL must be encoded. Tests: Task 3, "percent-encoded"; Task 6, "encodes the name".
3. **Upper-case extensions** (`IMG_1234.JPG`, `Ride.GPX`, as cameras and GPS units produce) — kind and MIME detection must ignore case. Test: Task 2, "extension matching ignores case".
4. **1Password supplies an incomplete environment** (a renamed field in the item) — the tool must say which variables are missing and stop, not re-launch itself forever. Test: Task 10, "fails instead of relaunching twice".
5. **Anything but an explicit yes at the prompt** (plain Enter, "n", "yep") — must cancel with nothing uploaded, written, or changed in `post.json`. Tests: Task 9, "declined confirmation"; Task 10, `isYes` cases.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `lib/publish/PublishError.js` | Error type for problems the user can fix; carries a `details` list. |
| `lib/publish/constants.js` | CDN base URL and the fixed author values. |
| `lib/publish/PostScaffold.js` | `--gen`: creates a post folder from the template. |
| `lib/publish/PostFolder.js` | Reads a post folder (post.json, HTML, file list with checksums); writes `entryId`/`datePosted` back. |
| `lib/publish/linkRewriter.js` | Finds and rewrites folder-relative `src`/`href` values. |
| `lib/publish/validate.js` | All local validation rules; returns every problem at once. |
| `lib/publish/timestamps.js` | Local-time timestamp formatting. |
| `lib/publish/postRecord.js` | Turns a validated folder into the record the database writer stores. |
| `lib/publish/CdnStore.js` | Bunny storage zone client: list root with checksums, upload. |
| `lib/publish/PublishPlanner.js` | Classifies each file as upload / skip / collision. |
| `lib/publish/PostWriter.js` | Database reads and the publish transaction, with retry. |
| `lib/publish/Publisher.js` | Orchestrates validate → plan → confirm → upload → write → write-back. |
| `lib/publish/cli.js` | Argument parsing, relaunch decision, `op run` command, yes/no parsing. |
| `scripts/blog-post.js` | Entry point: wiring, `op run` relaunch, prompt, exit codes. |
| `scripts/publish/publish.env` | 1Password references for the `PUBLISH_*` variables. |
| `scripts/publish/create-publisher-role.sql` | One-time SQL creating the `blog_publisher` role. |
| `__tests__/lib/publish/support/postFixture.js` | Test helper: builds temporary post folders. |
| `__tests__/lib/publish/support/fakeDatabase.js` | Test helper: in-memory stand-in for a `pg` pool. |

---

### Task 1: Scaffolding with `--gen`

**Files:**
- Create: `lib/publish/PublishError.js`
- Create: `lib/publish/constants.js`
- Create: `lib/publish/PostScaffold.js`
- Modify: `.gitignore` (append `/posts`)
- Test: `__tests__/lib/publish/PostScaffold.test.js`

**Interfaces:**
- Produces: `class PublishError extends Error { constructor(message: string, details: string[] = []) }` with `.details: string[]` and `.name === 'PublishError'`; default export.
- Produces: `export const CDN_BASE_URL = 'https://raserio.b-cdn.net'`, `export const AUTHOR = { userId: 1, userName: 'Chris' }` from `constants.js`.
- Produces: `export const POST_TEMPLATE` (object) and `export function createPostScaffold(postsRoot: string, name: string): string` (returns the new folder's path) from `PostScaffold.js`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/PostScaffold.test.js`:

```js
/**
 * ABOUTME: Tests for --gen, which creates a new post folder from the template.
 * ABOUTME: Works in a temporary directory so nothing lands in the repo's posts/ folder.
 *
 * @jest-environment node
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createPostScaffold, POST_TEMPLATE } from '@/lib/publish/PostScaffold';
import PublishError from '@/lib/publish/PublishError';

let root;

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-'));
});

afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
});

test('creates the folder with template files and empty images/ and docs/', () => {
    const dir = createPostScaffold(root, 'my-trip');

    expect(dir).toBe(path.join(root, 'my-trip'));
    expect(fs.readdirSync(dir).sort()).toEqual(['body.html', 'docs', 'images', 'intro.html', 'post.json']);
    expect(fs.readdirSync(path.join(dir, 'images'))).toEqual([]);
    expect(fs.readdirSync(path.join(dir, 'docs'))).toEqual([]);
});

test('post.json holds the template, including the attachment example', () => {
    const dir = createPostScaffold(root, 'my-trip');
    const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8'));

    expect(post).toEqual({
        title: '',
        datePosted: null,
        titleImage: null,
        via: { url: null, title: null, text: null },
        tags: [],
        attachments: [],
        _attachmentExample: {
            path: 'images/hero.jpg',
            title: 'Halls Lake',
            description: 'Optional longer description',
            gallery: false
        },
        entryId: null
    });
    expect(post).toEqual(POST_TEMPLATE);
});

test('intro.html and body.html hold placeholder paragraphs', () => {
    const dir = createPostScaffold(root, 'my-trip');

    expect(fs.readFileSync(path.join(dir, 'intro.html'), 'utf-8')).toContain('<p>');
    expect(fs.readFileSync(path.join(dir, 'body.html'), 'utf-8')).toContain('<p>');
});

test('creates the posts root when it does not exist yet', () => {
    const dir = createPostScaffold(path.join(root, 'posts'), 'my-trip');

    expect(fs.existsSync(path.join(dir, 'post.json'))).toBe(true);
});

test('refuses an existing folder and leaves it untouched', () => {
    fs.mkdirSync(path.join(root, 'my-trip'));
    fs.writeFileSync(path.join(root, 'my-trip', 'keep.txt'), 'mine');

    expect(() => createPostScaffold(root, 'my-trip')).toThrow(PublishError);
    expect(fs.readdirSync(path.join(root, 'my-trip'))).toEqual(['keep.txt']);
});

test.each(['', '../escape', 'a/b', '.hidden'])('rejects the folder name %p', (name) => {
    expect(() => createPostScaffold(root, name)).toThrow(PublishError);
});

test('PublishError carries details', () => {
    const error = new PublishError('bad', ['one', 'two']);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PublishError');
    expect(error.message).toBe('bad');
    expect(error.details).toEqual(['one', 'two']);
    expect(new PublishError('plain').details).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/PostScaffold.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/PostScaffold'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/PublishError.js`:

```js
// ABOUTME: Error for publishing problems the user can fix, such as a bad post.json or a CDN name collision.
// ABOUTME: Carries a list of details so every problem can be reported at once.

export default class PublishError extends Error {
    /**
     * @param message {string} one-line summary
     * @param details {Array<string>} individual problems, printed one per line
     */
    constructor(message, details = []) {
        super(message);
        this.name = 'PublishError';
        this.details = details;
    }
}
```

Create `lib/publish/constants.js`:

```js
// ABOUTME: Fixed values the publisher writes for every post.
// ABOUTME: CDN_BASE_URL matches the images.postcard template in siteconfig.json.

export const CDN_BASE_URL = 'https://raserio.b-cdn.net';

export const AUTHOR = { userId: 1, userName: 'Chris' };
```

Create `lib/publish/PostScaffold.js`:

```js
// ABOUTME: Creates a new post folder from the template, for `npm run blog-post -- --gen <name>`.
// ABOUTME: Never touches a folder that already exists.

import fs from 'node:fs';
import path from 'node:path';
import PublishError from './PublishError.js';

export const POST_TEMPLATE = {
    title: '',
    datePosted: null,
    titleImage: null,
    via: { url: null, title: null, text: null },
    tags: [],
    attachments: [],
    _attachmentExample: {
        path: 'images/hero.jpg',
        title: 'Halls Lake',
        description: 'Optional longer description',
        gallery: false
    },
    entryId: null
};

const INTRO_TEMPLATE = '<p> Intro. Shown on the front page and in the archive.\n</p>\n';
const BODY_TEMPLATE = "<p> Body. Shown only on the post's own page.\n</p>\n";

/** Letters, digits, dot, dash and underscore, not starting with a dot. */
const FOLDER_NAME = /^[\w-][\w.-]*$/;

/**
 * @param postsRoot {string} folder that holds post folders; created if missing
 * @param name {string} name of the new post folder
 * @returns {string} path of the new folder
 */
export function createPostScaffold(postsRoot, name) {
    if (!FOLDER_NAME.test(name)) {
        throw new PublishError(`"${name}" is not a usable folder name. Use letters, digits, ".", "-" and "_".`);
    }
    const dir = path.join(postsRoot, name);
    if (fs.existsSync(dir)) {
        throw new PublishError(`${dir} already exists; not touching it.`);
    }
    fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'docs'));
    fs.writeFileSync(path.join(dir, 'post.json'), `${JSON.stringify(POST_TEMPLATE, null, 2)}\n`);
    fs.writeFileSync(path.join(dir, 'intro.html'), INTRO_TEMPLATE);
    fs.writeFileSync(path.join(dir, 'body.html'), BODY_TEMPLATE);
    return dir;
}
```

Append to `.gitignore`:

```
# blog post folders, published with `npm run blog-post`
/posts
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/PostScaffold.test.js`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add lib/publish/PublishError.js lib/publish/constants.js lib/publish/PostScaffold.js .gitignore __tests__/lib/publish/PostScaffold.test.js
git commit -m "BLOG-POST-PUBLISHER: scaffold post folders with --gen" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Reading a post folder

**Files:**
- Create: `lib/publish/PostFolder.js`
- Create: `__tests__/lib/publish/support/postFixture.js`
- Test: `__tests__/lib/publish/PostFolder.test.js`

**Interfaces:**
- Consumes: `PublishError` (Task 1).
- Produces, from `PostFolder.js`:
  - `export function readPostFolder(dir: string): Folder` where `Folder = { dir: string, post: object, intro: string|null, body: string, files: FileInfo[] }`. `post` has every top-level key starting with `_` removed. `intro` is `null` when `intro.html` is missing; `body` is `''` when `body.html` is missing. Throws `PublishError` if `post.json` is missing, not JSON, or not a JSON object.
  - `FileInfo = { path: string /* 'images/hero.jpg', '/'-separated, relative to dir */, name: string /* basename */, absolutePath: string, kind: 'image'|'document'|'map', mimeType: string, checksum: string /* upper-case hex SHA-256 */ }`. `files` is sorted by `path`.
  - `export function writeBack(dir: string, { entryId: number, datePosted: string }): void`
  - `export function sha256(bytes: Buffer|Uint8Array): string` (upper-case hex)
- Produces, from `__tests__/lib/publish/support/postFixture.js`:
  - `makePostFolder({ post?, intro?, body?, files? }): string` — creates a temp folder. `post` defaults to `{ title: 'My Trip' }`, is written with `JSON.stringify(post, null, 2)`; a string is written verbatim; `null` writes no `post.json`. `intro` defaults to `'<p>Intro</p>\n'`, `body` to `''`; `null` skips the file. `files` maps relative paths to string or Buffer contents.
  - `removeFolder(dir: string): void`

- [ ] **Step 1: Write the test helper**

Create `__tests__/lib/publish/support/postFixture.js`:

```js
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
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/lib/publish/PostFolder.test.js`:

```js
/**
 * ABOUTME: Tests for reading a post folder from disk and writing publish results back to post.json.
 * ABOUTME: Uses real temporary folders built by the postFixture helper.
 *
 * @jest-environment node
 */

import fs from 'node:fs';
import path from 'node:path';
import { readPostFolder, writeBack, sha256 } from '@/lib/publish/PostFolder';
import PublishError from '@/lib/publish/PublishError';
import { makePostFolder, removeFolder } from './support/postFixture';

let dir;

afterEach(() => {
    if (dir) {
        removeFolder(dir);
        dir = null;
    }
});

/** FileInfo without the machine-specific absolutePath, for comparisons. */
const portable = ({ absolutePath, ...rest }) => rest;

describe('readPostFolder', () => {
    test('reads post.json, intro.html and body.html', () => {
        dir = makePostFolder({ post: { title: 'My Trip' }, intro: '<p>i</p>', body: '<p>b</p>' });

        const folder = readPostFolder(dir);

        expect(folder.dir).toBe(dir);
        expect(folder.post).toEqual({ title: 'My Trip' });
        expect(folder.intro).toBe('<p>i</p>');
        expect(folder.body).toBe('<p>b</p>');
        expect(folder.files).toEqual([]);
    });

    test('drops top-level keys that start with "_"', () => {
        dir = makePostFolder({ post: { title: 'T', _attachmentExample: { path: 'x' }, _note: 'hi' } });

        expect(readPostFolder(dir).post).toEqual({ title: 'T' });
    });

    test('a missing intro.html reads as null and a missing body.html as empty', () => {
        dir = makePostFolder({ intro: null, body: null });

        const folder = readPostFolder(dir);

        expect(folder.intro).toBeNull();
        expect(folder.body).toBe('');
    });

    test('a missing post.json is a PublishError', () => {
        dir = makePostFolder({ post: null });

        expect(() => readPostFolder(dir)).toThrow(PublishError);
    });

    test('post.json that is not JSON is a PublishError', () => {
        dir = makePostFolder({ post: '{ nope' });

        expect(() => readPostFolder(dir)).toThrow(/not valid JSON/);
    });

    test('post.json that is not an object is a PublishError', () => {
        dir = makePostFolder({ post: '[1, 2]' });

        expect(() => readPostFolder(dir)).toThrow(PublishError);
    });

    test('lists files under images/ and docs/ with kind, MIME type and checksum, sorted by path', () => {
        dir = makePostFolder({
            files: {
                'images/hero.jpg': 'jpg-bytes',
                'docs/route.pdf': 'pdf-bytes',
                'images/ride.gpx': '<gpx/>'
            }
        });

        const folder = readPostFolder(dir);

        expect(folder.files.map(portable)).toEqual([
            { path: 'docs/route.pdf', name: 'route.pdf', kind: 'document', mimeType: 'application/pdf', checksum: sha256(Buffer.from('pdf-bytes')) },
            { path: 'images/hero.jpg', name: 'hero.jpg', kind: 'image', mimeType: 'image/jpeg', checksum: sha256(Buffer.from('jpg-bytes')) },
            { path: 'images/ride.gpx', name: 'ride.gpx', kind: 'map', mimeType: 'application/gpx+xml', checksum: sha256(Buffer.from('<gpx/>')) }
        ]);
        expect(folder.files[1].absolutePath).toBe(path.join(dir, 'images', 'hero.jpg'));
    });

    test('walks subfolders', () => {
        dir = makePostFolder({ files: { 'images/day1/a.jpg': 'a' } });

        expect(readPostFolder(dir).files.map(portable)).toEqual([
            { path: 'images/day1/a.jpg', name: 'a.jpg', kind: 'image', mimeType: 'image/jpeg', checksum: sha256(Buffer.from('a')) }
        ]);
    });

    test('ignores dotfiles such as .DS_Store, and dot-folders', () => {
        dir = makePostFolder({
            files: {
                'images/.DS_Store': 'junk',
                'images/a.jpg': 'a',
                'docs/.hidden/b.pdf': 'b'
            }
        });

        expect(readPostFolder(dir).files.map(f => f.path)).toEqual(['images/a.jpg']);
    });

    test('extension matching ignores case', () => {
        dir = makePostFolder({ files: { 'images/IMG_1.JPG': 'a', 'docs/Ride.GPX': 'b' } });

        const byName = Object.fromEntries(readPostFolder(dir).files.map(f => [f.name, f]));

        expect(byName['IMG_1.JPG']).toMatchObject({ kind: 'image', mimeType: 'image/jpeg' });
        expect(byName['Ride.GPX']).toMatchObject({ kind: 'map', mimeType: 'application/gpx+xml' });
    });

    test('unknown extensions get application/octet-stream', () => {
        dir = makePostFolder({ files: { 'docs/notes.xyz': 'n' } });

        expect(readPostFolder(dir).files[0].mimeType).toBe('application/octet-stream');
    });

    test('ignores files outside images/ and docs/', () => {
        dir = makePostFolder({ files: { 'other/x.jpg': 'x', 'stray.jpg': 's' } });

        expect(readPostFolder(dir).files).toEqual([]);
    });
});

describe('sha256', () => {
    test('is upper-case hex', () => {
        expect(sha256(Buffer.from('abc'))).toBe('BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
    });
});

describe('writeBack', () => {
    test('writes entryId and datePosted, keeping other content and key order', () => {
        dir = makePostFolder({ post: { title: 'T', datePosted: null, _attachmentExample: { path: 'p' }, entryId: null } });

        writeBack(dir, { entryId: 3421, datePosted: '2026-10-03 14:30' });

        expect(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8')).toBe(
            `${JSON.stringify({ title: 'T', datePosted: '2026-10-03 14:30', _attachmentExample: { path: 'p' }, entryId: 3421 }, null, 2)}\n`
        );
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/PostFolder.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/PostFolder'`.

- [ ] **Step 4: Write minimal implementation**

Create `lib/publish/PostFolder.js`:

```js
// ABOUTME: Reads a post folder (post.json, intro.html, body.html, images/, docs/) from disk.
// ABOUTME: Also writes the publish results, entryId and datePosted, back into post.json.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import PublishError from './PublishError.js';

/** Folders whose files are uploaded, and the attachment kind each implies. */
const FILE_FOLDERS = { images: 'image', docs: 'document' };

const MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.gpx': 'application/gpx+xml',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime'
};

const DEFAULT_MIME_TYPE = 'application/octet-stream';

/**
 * @param dir {string} the post folder
 * @returns {{dir: string, post: Object, intro: (string|null), body: string, files: Array<Object>}}
 */
export function readPostFolder(dir) {
    return {
        dir,
        post: readPost(path.join(dir, 'post.json')),
        intro: readOptional(path.join(dir, 'intro.html')),
        body: readOptional(path.join(dir, 'body.html')) ?? '',
        files: listFiles(dir)
    };
}

/**
 * Records the results of a publish. Re-reads the file so keys starting with "_",
 * which readPostFolder drops, survive.
 */
export function writeBack(dir, { entryId, datePosted }) {
    const postPath = path.join(dir, 'post.json');
    const post = JSON.parse(fs.readFileSync(postPath, 'utf-8'));
    post.entryId = entryId;
    post.datePosted = datePosted;
    fs.writeFileSync(postPath, `${JSON.stringify(post, null, 2)}\n`);
}

/** Upper-case hex, the form Bunny's storage listing reports. */
export function sha256(bytes) {
    return crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function readPost(postPath) {
    if (!fs.existsSync(postPath)) {
        throw new PublishError(`${postPath} not found. Create a post folder with --gen.`);
    }
    let post;
    try {
        post = JSON.parse(fs.readFileSync(postPath, 'utf-8'));
    } catch (error) {
        throw new PublishError(`${postPath} is not valid JSON: ${error.message}`);
    }
    if (post === null || typeof post !== 'object' || Array.isArray(post)) {
        throw new PublishError(`${postPath} must hold a JSON object.`);
    }
    for (const key of Object.keys(post)) {
        if (key.startsWith('_')) {
            delete post[key];
        }
    }
    return post;
}

function readOptional(filePath) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
}

function listFiles(dir) {
    const files = [];
    for (const [folder, kind] of Object.entries(FILE_FOLDERS)) {
        const root = path.join(dir, folder);
        if (!fs.existsSync(root)) {
            continue;
        }
        walk(root, (absolutePath) => {
            const name = path.basename(absolutePath);
            const extension = path.extname(name).toLowerCase();
            files.push({
                path: path.relative(dir, absolutePath).split(path.sep).join('/'),
                name,
                absolutePath,
                kind: extension === '.gpx' ? 'map' : kind,
                mimeType: MIME_TYPES[extension] ?? DEFAULT_MIME_TYPE,
                checksum: sha256(fs.readFileSync(absolutePath))
            });
        });
    }
    return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Visits every regular file below dir, skipping dotfiles and dot-folders such as .DS_Store. */
function walk(dir, visit) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) {
            continue;
        }
        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(absolutePath, visit);
        } else if (entry.isFile()) {
            visit(absolutePath);
        }
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/PostFolder.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/publish/PostFolder.js __tests__/lib/publish/support/postFixture.js __tests__/lib/publish/PostFolder.test.js
git commit -m "BLOG-POST-PUBLISHER: read post folders and write publish results back" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Link rewriting

**Files:**
- Create: `lib/publish/linkRewriter.js`
- Test: `__tests__/lib/publish/linkRewriter.test.js`

**Interfaces:**
- Produces:
  - `export function findFolderReferences(html: string|null): string[]` — every `src`/`href` value that, after percent-decoding and removing a leading `./`, starts with `images/` or `docs/`; normalized values, in document order.
  - `export function rewriteLinks(html: string, files: Array<{path: string, name: string}>, cdnBaseUrl: string): string` — replaces `src`/`href` values that (normalized the same way) equal a file's `path` with `cdnUrl(cdnBaseUrl, file.name)`; everything else unchanged.
  - `export function cdnUrl(cdnBaseUrl: string, name: string): string` — `${cdnBaseUrl}/${encodeURIComponent(name)}`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/linkRewriter.test.js`:

```js
/**
 * ABOUTME: Tests for finding and rewriting folder-relative src/href values in post HTML.
 * ABOUTME: Pure string functions; no file system or network.
 *
 * @jest-environment node
 */

import { findFolderReferences, rewriteLinks, cdnUrl } from '@/lib/publish/linkRewriter';

const CDN = 'https://cdn.example';
const FILES = [
    { path: 'images/hero.jpg', name: 'hero.jpg' },
    { path: 'docs/my route.pdf', name: 'my route.pdf' }
];

describe('rewriteLinks', () => {
    test('rewrites a src that names a file in the folder', () => {
        expect(rewriteLinks('<img src="images/hero.jpg">', FILES, CDN)).toBe('<img src="https://cdn.example/hero.jpg">');
    });

    test('rewrites single-quoted values and keeps the quote style', () => {
        expect(rewriteLinks("<a href='images/hero.jpg'>x</a>", FILES, CDN)).toBe("<a href='https://cdn.example/hero.jpg'>x</a>");
    });

    test('accepts a leading ./', () => {
        expect(rewriteLinks('<img src="./images/hero.jpg">', FILES, CDN)).toBe('<img src="https://cdn.example/hero.jpg">');
    });

    test('matches percent-encoded references and encodes the CDN URL', () => {
        expect(rewriteLinks('<a href="docs/my%20route.pdf">r</a>', FILES, CDN)).toBe('<a href="https://cdn.example/my%20route.pdf">r</a>');
    });

    test('matches attribute names in any case', () => {
        expect(rewriteLinks('<IMG SRC="images/hero.jpg">', FILES, CDN)).toBe('<IMG SRC="https://cdn.example/hero.jpg">');
    });

    test('leaves everything else alone', () => {
        const html = '<a href="https://example.com/images/hero.jpg">a</a><a href="archive/3419">b</a><img src="images/missing.jpg">';

        expect(rewriteLinks(html, FILES, CDN)).toBe(html);
    });
});

describe('findFolderReferences', () => {
    test('returns normalized images/ and docs/ references in order', () => {
        const html = '<img src="images/a.jpg"><a href="docs/b%20c.pdf">x</a><a href="archive/1">y</a><img src=\'./images/d.jpg\'>';

        expect(findFolderReferences(html)).toEqual(['images/a.jpg', 'docs/b c.pdf', 'images/d.jpg']);
    });

    test('handles empty and missing HTML', () => {
        expect(findFolderReferences('')).toEqual([]);
        expect(findFolderReferences(null)).toEqual([]);
    });
});

describe('cdnUrl', () => {
    test('encodes the file name', () => {
        expect(cdnUrl(CDN, 'a b.jpg')).toBe('https://cdn.example/a%20b.jpg');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/linkRewriter.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/linkRewriter'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/linkRewriter.js`:

```js
// ABOUTME: Finds and rewrites src/href values in post HTML that point at files in the post folder.
// ABOUTME: Lets the HTML reference images/hero.jpg locally while the stored post uses the CDN URL.

/** A src or href attribute with a single- or double-quoted value. */
const ATTRIBUTE = /\b(src|href)\s*=\s*(["'])(.*?)\2/gi;

const FOLDER_REFERENCE = /^(images|docs)\//;

export function findFolderReferences(html) {
    const references = [];
    for (const match of (html ?? '').matchAll(ATTRIBUTE)) {
        const value = normalize(match[3]);
        if (FOLDER_REFERENCE.test(value)) {
            references.push(value);
        }
    }
    return references;
}

export function rewriteLinks(html, files, cdnBaseUrl) {
    const namesByPath = new Map(files.map(file => [file.path, file.name]));
    return html.replace(ATTRIBUTE, (whole, attribute, quote, value) => {
        const name = namesByPath.get(normalize(value));
        return name ? `${attribute}=${quote}${cdnUrl(cdnBaseUrl, name)}${quote}` : whole;
    });
}

export function cdnUrl(cdnBaseUrl, name) {
    return `${cdnBaseUrl}/${encodeURIComponent(name)}`;
}

/** Decodes %20 and friends and drops a leading "./", so equivalent spellings compare equal. */
function normalize(value) {
    let decoded;
    try {
        decoded = decodeURIComponent(value);
    } catch {
        decoded = value;
    }
    return decoded.replace(/^\.\//, '');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/linkRewriter.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/publish/linkRewriter.js __tests__/lib/publish/linkRewriter.test.js
git commit -m "BLOG-POST-PUBLISHER: rewrite folder-relative links to CDN URLs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Validation

**Files:**
- Create: `lib/publish/validate.js`
- Test: `__tests__/lib/publish/validate.test.js`

**Interfaces:**
- Consumes: `findFolderReferences` (Task 3); the `Folder` shape from Task 2 (only `post`, `intro`, `body`, and `files[].path`/`files[].name` are read).
- Produces: `export function validatePostFolder(folder: Folder): string[]` — every problem found, empty when valid.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/validate.test.js`:

```js
/**
 * ABOUTME: Tests for the local checks run on a post folder before anything touches the network.
 * ABOUTME: Builds folder objects in memory; the file system is covered by the PostFolder tests.
 *
 * @jest-environment node
 */

import { validatePostFolder } from '@/lib/publish/validate';

const file = (path) => ({ path, name: path.split('/').pop() });

function folder({ post = {}, intro = '<p>i</p>', body = '', files = ['images/hero.jpg', 'docs/route.pdf'] } = {}) {
    return { post: { title: 'My Trip', ...post }, intro, body, files: files.map(file) };
}

test('a minimal folder is valid', () => {
    expect(validatePostFolder(folder())).toEqual([]);
});

test('a fully filled-in folder is valid', () => {
    const valid = folder({
        post: {
            datePosted: '2026-10-03 14:30',
            titleImage: 'images/hero.jpg',
            via: { url: 'https://example.com', title: 'Example', text: 'via' },
            tags: ['bikes'],
            attachments: [{ path: 'images/hero.jpg', title: 'Hero', gallery: true }],
            entryId: 3421
        },
        intro: '<img src="images/hero.jpg">',
        body: '<a href="docs/route.pdf">route</a>'
    });

    expect(validatePostFolder(valid)).toEqual([]);
});

test.each([
    ['blank title', { post: { title: '  ' } }, '"title"'],
    ['missing title', { post: { title: undefined } }, '"title"'],
    ['date without time', { post: { datePosted: '2026-10-03' } }, '"datePosted"'],
    ['entryId as a string', { post: { entryId: '3421' } }, '"entryId"'],
    ['titleImage not in folder', { post: { titleImage: 'images/nope.jpg' } }, '"titleImage"'],
    ['via not an object', { post: { via: 'x' } }, '"via"'],
    ['via field not a string', { post: { via: { url: 5 } } }, '"via.url"'],
    ['tags not an array', { post: { tags: 'bikes' } }, '"tags"'],
    ['blank tag', { post: { tags: [''] } }, '"tags"'],
    ['attachments not an array', { post: { attachments: {} } }, '"attachments" must be an array'],
    ['attachment without path', { post: { attachments: [{ title: 'x' }] } }, 'attachments[0] needs a "path"'],
    ['attachment path not in folder', { post: { attachments: [{ path: 'images/nope.jpg' }] } }, 'attachments[0] "images/nope.jpg"'],
    ['attachment listed twice', { post: { attachments: [{ path: 'images/hero.jpg' }, { path: 'images/hero.jpg' }] } }, 'listed twice'],
    ['missing intro.html', { intro: null }, 'intro.html is missing'],
    ['two files with one name', { files: ['images/x.jpg', 'docs/x.jpg'] }, '"x.jpg" appears more than once'],
    ['intro references a missing file', { intro: '<img src="images/nope.jpg">' }, 'intro.html: "images/nope.jpg"'],
    ['body references a missing file', { body: '<a href="docs/nope.pdf">x</a>' }, 'body.html: "docs/nope.pdf"']
])('reports %s', (description, args, expected) => {
    expect(validatePostFolder(folder(args)).join('\n')).toContain(expected);
});

test('reports every problem at once', () => {
    const errors = validatePostFolder(folder({ post: { title: '', titleImage: 'images/nope.jpg' }, intro: null }));

    expect(errors).toHaveLength(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/validate.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/validate'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/validate.js`:

```js
// ABOUTME: Checks a post folder for every problem that can be found without the network.
// ABOUTME: Returns all problems at once so one run shows everything to fix.

import { findFolderReferences } from './linkRewriter.js';

const DATE_POSTED = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const VIA_FIELDS = ['url', 'title', 'text'];

/**
 * @param folder {{post: Object, intro: (string|null), body: string, files: Array<{path: string, name: string}>}}
 * @returns {Array<string>} problems; empty when the folder can be published
 */
export function validatePostFolder({ post, intro, body, files }) {
    const paths = new Set(files.map(file => file.path));
    return [
        ...checkPost(post, paths),
        ...checkAttachments(post.attachments, paths),
        ...(intro === null ? ['intro.html is missing.'] : []),
        ...checkUniqueNames(files),
        ...checkReferences('intro.html', intro, paths),
        ...checkReferences('body.html', body, paths)
    ];
}

function checkPost(post, paths) {
    const errors = [];
    if (typeof post.title !== 'string' || post.title.trim() === '') {
        errors.push('post.json: "title" must be a non-empty string.');
    }
    if (post.datePosted != null && !(typeof post.datePosted === 'string' && DATE_POSTED.test(post.datePosted))) {
        errors.push('post.json: "datePosted" must be null or "YYYY-MM-DD HH:MM".');
    }
    if (post.entryId != null && !(Number.isInteger(post.entryId) && post.entryId > 0)) {
        errors.push('post.json: "entryId" must be null or a positive integer; the tool writes it after the first publish.');
    }
    if (post.titleImage != null && !paths.has(post.titleImage)) {
        errors.push(`post.json: "titleImage" ${JSON.stringify(post.titleImage)} is not a file in images/ or docs/.`);
    }
    if (post.via != null) {
        if (typeof post.via !== 'object' || Array.isArray(post.via)) {
            errors.push('post.json: "via" must be an object.');
        } else {
            for (const field of VIA_FIELDS) {
                if (post.via[field] != null && typeof post.via[field] !== 'string') {
                    errors.push(`post.json: "via.${field}" must be a string or null.`);
                }
            }
        }
    }
    if (post.tags != null && !(Array.isArray(post.tags) && post.tags.every(tag => typeof tag === 'string' && tag.trim() !== ''))) {
        errors.push('post.json: "tags" must be an array of non-empty strings.');
    }
    return errors;
}

function checkAttachments(attachments, paths) {
    if (attachments == null) {
        return [];
    }
    if (!Array.isArray(attachments)) {
        return ['post.json: "attachments" must be an array.'];
    }
    const errors = [];
    const seen = new Set();
    attachments.forEach((attachment, index) => {
        const label = `post.json: attachments[${index}]`;
        if (attachment === null || typeof attachment !== 'object' || typeof attachment.path !== 'string') {
            errors.push(`${label} needs a "path" naming a file in images/ or docs/.`);
        } else if (!paths.has(attachment.path)) {
            errors.push(`${label} ${JSON.stringify(attachment.path)} is not a file in images/ or docs/.`);
        } else if (seen.has(attachment.path)) {
            errors.push(`${label} ${JSON.stringify(attachment.path)} is listed twice.`);
        } else {
            seen.add(attachment.path);
        }
    });
    return errors;
}

/** Files upload to the CDN under their name alone, so two files may not share one. */
function checkUniqueNames(files) {
    const pathsByName = new Map();
    for (const file of files) {
        pathsByName.set(file.name, [...(pathsByName.get(file.name) ?? []), file.path]);
    }
    return [...pathsByName.entries()]
        .filter(([, filePaths]) => filePaths.length > 1)
        .map(([name, filePaths]) => `"${name}" appears more than once (${filePaths.join(', ')}); files upload by name alone, so names must be unique.`);
}

function checkReferences(label, html, paths) {
    return findFolderReferences(html)
        .filter(reference => !paths.has(reference))
        .map(reference => `${label}: "${reference}" is not a file in the folder.`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/validate.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/publish/validate.js __tests__/lib/publish/validate.test.js
git commit -m "BLOG-POST-PUBLISHER: validate post folders before publishing" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Building the database record

**Files:**
- Create: `lib/publish/timestamps.js`
- Create: `lib/publish/postRecord.js`
- Test: `__tests__/lib/publish/postRecord.test.js`

**Interfaces:**
- Consumes: `rewriteLinks` (Task 3); `CDN_BASE_URL`, `AUTHOR` (Task 1); a validated `Folder` (Task 2).
- Produces, from `timestamps.js`:
  - `export function formatLocalMinute(date: Date): string` → `'YYYY-MM-DD HH:MM'`
  - `export function formatLocalSecond(date: Date): string` → `'YYYY-MM-DD HH:MM:SS'`
- Produces, from `postRecord.js`:
  - `export function buildPostRecord(folder: Folder, { entryId: number|null, datePosted: string /* YYYY-MM-DD HH:MM */, lastUpdated: string /* YYYY-MM-DD HH:MM:SS */ }): PostRecord`
  - `PostRecord = { entryId: number|null, title, intro, body: string|null, datePosted /* YYYY-MM-DD HH:MM:SS */, lastUpdated, imageFileName: string|null, imageFileType: 0|1|null, viaUrl, viaTitle, viaText, userId: number, userName: string, tags: string[], attachments: Array<{ fileName, fileType: 'image'|'document'|'map', mimeType, title, description: string|null, isGallery: boolean }> }`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/postRecord.test.js`:

```js
/**
 * ABOUTME: Tests for turning a validated post folder into the record written to the database.
 * ABOUTME: Also covers the local-time timestamp formatting the record uses.
 *
 * @jest-environment node
 */

import { buildPostRecord } from '@/lib/publish/postRecord';
import { formatLocalMinute, formatLocalSecond } from '@/lib/publish/timestamps';

const FILES = [
    { path: 'images/hero.jpg', name: 'hero.jpg', kind: 'image', mimeType: 'image/jpeg' },
    { path: 'images/ride.gpx', name: 'ride.gpx', kind: 'map', mimeType: 'application/gpx+xml' },
    { path: 'docs/route.pdf', name: 'route.pdf', kind: 'document', mimeType: 'application/pdf' }
];
const TIMES = { entryId: null, datePosted: '2026-10-03 14:30', lastUpdated: '2026-10-03 14:31:07' };

function folder(post = {}, { intro = '<p>i</p>', body = '' } = {}) {
    return { post: { title: 'My Trip', ...post }, intro, body, files: FILES };
}

describe('timestamps', () => {
    test('formats local time to the minute and to the second', () => {
        const date = new Date(2026, 9, 3, 4, 5, 6);

        expect(formatLocalMinute(date)).toBe('2026-10-03 04:05');
        expect(formatLocalSecond(date)).toBe('2026-10-03 04:05:06');
    });
});

describe('buildPostRecord', () => {
    test('maps the post fields and fixed values', () => {
        const record = buildPostRecord(folder({ via: { url: 'https://v.example', title: 'V', text: 'via' } }), TIMES);

        expect(record).toMatchObject({
            entryId: null,
            title: 'My Trip',
            intro: '<p>i</p>',
            body: null,
            datePosted: '2026-10-03 14:30:00',
            lastUpdated: '2026-10-03 14:31:07',
            imageFileName: null,
            imageFileType: null,
            viaUrl: 'https://v.example',
            viaTitle: 'V',
            viaText: 'via',
            userId: 1,
            userName: 'Chris',
            tags: []
        });
    });

    test('carries an existing entryId through', () => {
        expect(buildPostRecord(folder(), { ...TIMES, entryId: 3421 }).entryId).toBe(3421);
    });

    test('trims the title', () => {
        expect(buildPostRecord(folder({ title: '  My Trip  ' }), TIMES).title).toBe('My Trip');
    });

    test('an image title image is type 1, a .gpx title image is type 0', () => {
        expect(buildPostRecord(folder({ titleImage: 'images/hero.jpg' }), TIMES)).toMatchObject({ imageFileName: 'hero.jpg', imageFileType: 1 });
        expect(buildPostRecord(folder({ titleImage: 'images/ride.gpx' }), TIMES)).toMatchObject({ imageFileName: 'ride.gpx', imageFileType: 0 });
    });

    test('rewrites folder links in intro and body to CDN URLs', () => {
        const record = buildPostRecord(folder({}, { intro: '<img src="images/hero.jpg">', body: '<a href="docs/route.pdf">r</a>' }), TIMES);

        expect(record.intro).toBe('<img src="https://raserio.b-cdn.net/hero.jpg">');
        expect(record.body).toBe('<a href="https://raserio.b-cdn.net/route.pdf">r</a>');
    });

    test('a whitespace-only body is stored as null', () => {
        expect(buildPostRecord(folder({}, { body: '  \n' }), TIMES).body).toBeNull();
    });

    test('missing via fields become null', () => {
        expect(buildPostRecord(folder(), TIMES)).toMatchObject({ viaUrl: null, viaTitle: null, viaText: null });
    });

    test('tags are trimmed and de-duplicated', () => {
        expect(buildPostRecord(folder({ tags: [' bikes ', 'bikes', 'mtb'] }), TIMES).tags).toEqual(['bikes', 'mtb']);
    });

    test('every file becomes an attachment, with metadata where post.json gives it', () => {
        const record = buildPostRecord(folder({
            attachments: [{ path: 'images/hero.jpg', title: 'Halls Lake', description: 'Camp', gallery: true }]
        }), TIMES);

        expect(record.attachments).toEqual([
            { fileName: 'hero.jpg', fileType: 'image', mimeType: 'image/jpeg', title: 'Halls Lake', description: 'Camp', isGallery: true },
            { fileName: 'ride.gpx', fileType: 'map', mimeType: 'application/gpx+xml', title: 'ride.gpx', description: null, isGallery: false },
            { fileName: 'route.pdf', fileType: 'document', mimeType: 'application/pdf', title: 'route.pdf', description: null, isGallery: false }
        ]);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/postRecord.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/postRecord'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/timestamps.js`:

```js
// ABOUTME: Formats dates as local-time strings, the form post.json and the database columns use.
// ABOUTME: The blog's TIMESTAMP columns carry no time zone, so local time is stored as written.

const pad = (n) => String(n).padStart(2, '0');

export function formatLocalMinute(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatLocalSecond(date) {
    return `${formatLocalMinute(date)}:${pad(date.getSeconds())}`;
}
```

Create `lib/publish/postRecord.js`:

```js
// ABOUTME: Turns a validated post folder into the record PostWriter stores.
// ABOUTME: Decides the title image fields, attachment metadata and the CDN form of the HTML.

import { AUTHOR, CDN_BASE_URL } from './constants.js';
import { rewriteLinks } from './linkRewriter.js';

/** blog_entries.image_file_type: 0 renders a map from a .gpx file, 1 an image. */
const MAP_IMAGE_TYPE = 0;
const IMAGE_TYPE = 1;

/**
 * @param folder {{post: Object, intro: string, body: string, files: Array<Object>}} a folder that passed validation
 * @param times {{entryId: (number|null), datePosted: string, lastUpdated: string}}
 */
export function buildPostRecord({ post, intro, body, files }, { entryId, datePosted, lastUpdated }) {
    const filesByPath = new Map(files.map(file => [file.path, file]));
    const metadataByPath = new Map((post.attachments ?? []).map(attachment => [attachment.path, attachment]));
    const titleFile = post.titleImage ? filesByPath.get(post.titleImage) : null;
    const storedBody = rewriteLinks(body, files, CDN_BASE_URL);

    return {
        entryId: entryId ?? null,
        title: post.title.trim(),
        intro: rewriteLinks(intro, files, CDN_BASE_URL),
        body: storedBody.trim() === '' ? null : storedBody,
        datePosted: `${datePosted}:00`,
        lastUpdated,
        imageFileName: titleFile ? titleFile.name : null,
        imageFileType: titleFile ? (titleFile.kind === 'map' ? MAP_IMAGE_TYPE : IMAGE_TYPE) : null,
        viaUrl: post.via?.url ?? null,
        viaTitle: post.via?.title ?? null,
        viaText: post.via?.text ?? null,
        userId: AUTHOR.userId,
        userName: AUTHOR.userName,
        tags: [...new Set((post.tags ?? []).map(tag => tag.trim()))],
        attachments: files.map((file) => {
            const metadata = metadataByPath.get(file.path) ?? {};
            return {
                fileName: file.name,
                fileType: file.kind,
                mimeType: file.mimeType,
                title: metadata.title ?? file.name,
                description: metadata.description ?? null,
                isGallery: metadata.gallery === true
            };
        })
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/postRecord.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/publish/timestamps.js lib/publish/postRecord.js __tests__/lib/publish/postRecord.test.js
git commit -m "BLOG-POST-PUBLISHER: build the database record for a post" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: CDN storage client

**Files:**
- Create: `lib/publish/CdnStore.js`
- Test: `__tests__/lib/publish/CdnStore.test.js`

**Interfaces:**
- Consumes: `PublishError` (Task 1).
- Produces: default export `class CdnStore`:
  - `constructor({ host: string, zone: string, accessKey: string, fetch?: Function /* defaults to globalThis.fetch */ })`
  - `async list(): Promise<Map<string /* file name */, string|null /* upper-case checksum, null when Bunny gives none */>>` — files at the zone root only; directories excluded.
  - `async upload(name: string, bytes: Buffer, contentType: string): Promise<void>`

Bunny Storage API: listing is `GET https://{host}/{zone}/` (trailing slash) with header `AccessKey`, returning a JSON array of objects with `ObjectName`, `IsDirectory`, `Checksum`. Upload is `PUT https://{host}/{zone}/{encoded name}` with `AccessKey` and `Content-Type`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/CdnStore.test.js`:

```js
/**
 * ABOUTME: Tests for the publisher's Bunny storage zone client.
 * ABOUTME: Injects a fake fetch; no network.
 *
 * @jest-environment node
 */

import CdnStore from '@/lib/publish/CdnStore';
import PublishError from '@/lib/publish/PublishError';

const fetchReturns = (status, body = null) => jest.fn().mockResolvedValue(new Response(body, { status }));

const store = (fetch) => new CdnStore({ host: 'la.storage.bunnycdn.com', zone: 'raserio', accessKey: 'test-key', fetch });

describe('list', () => {
    test('asks for the zone root with the access key', async () => {
        const fetch = fetchReturns(200, '[]');

        await store(fetch).list();

        expect(fetch).toHaveBeenCalledWith(
            'https://la.storage.bunnycdn.com/raserio/',
            expect.objectContaining({ headers: expect.objectContaining({ AccessKey: 'test-key' }) })
        );
    });

    test('maps file names to upper-case checksums and skips directories', async () => {
        const fetch = fetchReturns(200, JSON.stringify([
            { ObjectName: 'hero.jpg', IsDirectory: false, Checksum: 'ab12' },
            { ObjectName: 'maps', IsDirectory: true, Checksum: null },
            { ObjectName: 'old.gif', IsDirectory: false, Checksum: null }
        ]));

        const listing = await store(fetch).list();

        expect([...listing.entries()]).toEqual([['hero.jpg', 'AB12'], ['old.gif', null]]);
    });

    test('a failed listing is a PublishError naming the status', async () => {
        const promise = store(fetchReturns(401)).list();

        await expect(promise).rejects.toThrow(PublishError);
        await expect(store(fetchReturns(401)).list()).rejects.toThrow(/HTTP 401/);
    });
});

describe('upload', () => {
    test('PUTs the bytes to the encoded name', async () => {
        const fetch = fetchReturns(201);
        const bytes = Buffer.from('x');

        await store(fetch).upload('my photo.jpg', bytes, 'image/jpeg');

        expect(fetch).toHaveBeenCalledWith('https://la.storage.bunnycdn.com/raserio/my%20photo.jpg', {
            method: 'PUT',
            headers: { AccessKey: 'test-key', 'Content-Type': 'image/jpeg' },
            body: bytes
        });
    });

    test('a failed upload is a PublishError naming the file and status', async () => {
        await expect(store(fetchReturns(500)).upload('my photo.jpg', Buffer.from('x'), 'image/jpeg'))
            .rejects.toThrow(/my photo\.jpg.*HTTP 500/);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/CdnStore.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/CdnStore'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/CdnStore.js`:

```js
// ABOUTME: Lists and uploads files at the root of the Bunny CDN storage zone for the publisher.
// ABOUTME: Configured explicitly from PUBLISH_BUNNY_* values, never from the app's configuration.

import PublishError from './PublishError.js';

export default class CdnStore {
    #host;
    #zone;
    #accessKey;
    #fetch;

    constructor({ host, zone, accessKey, fetch = globalThis.fetch }) {
        this.#host = host;
        this.#zone = zone;
        this.#accessKey = accessKey;
        this.#fetch = fetch;
    }

    /**
     * @returns {Promise<Map<string, (string|null)>>} file name → upper-case SHA-256, for files at the zone root
     */
    async list() {
        const response = await this.#fetch(this.#url(''), {
            headers: { AccessKey: this.#accessKey, Accept: 'application/json' }
        });
        if (!response.ok) {
            throw new PublishError(`Could not list the CDN storage zone: HTTP ${response.status}. Check the Bunny values in 1Password.`);
        }
        const listing = new Map();
        for (const object of await response.json()) {
            if (!object.IsDirectory) {
                listing.set(object.ObjectName, object.Checksum ? object.Checksum.toUpperCase() : null);
            }
        }
        return listing;
    }

    async upload(name, bytes, contentType) {
        const response = await this.#fetch(this.#url(name), {
            method: 'PUT',
            headers: { AccessKey: this.#accessKey, 'Content-Type': contentType },
            body: bytes
        });
        response.body?.cancel?.();
        if (!response.ok) {
            throw new PublishError(`Upload of ${name} failed: HTTP ${response.status}.`);
        }
    }

    #url(name) {
        return `https://${this.#host}/${this.#zone}/${encodeURIComponent(name)}`;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/CdnStore.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/publish/CdnStore.js __tests__/lib/publish/CdnStore.test.js
git commit -m "BLOG-POST-PUBLISHER: Bunny storage client for listing and uploads" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Upload planning

**Files:**
- Create: `lib/publish/PublishPlanner.js`
- Test: `__tests__/lib/publish/PublishPlanner.test.js`

**Interfaces:**
- Consumes: `FileInfo` (Task 2; reads `name` and `checksum`), the listing `Map` from `CdnStore.list()` (Task 6).
- Produces: `export function planUploads({ files: FileInfo[], listing: Map<string, string|null>, ownedNames: Set<string>, force: boolean }): { upload: FileInfo[], skip: FileInfo[], collision: FileInfo[], forced: FileInfo[] }`. With `force`, would-be collisions go into both `upload` and `forced`, and `collision` stays empty.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/PublishPlanner.test.js`:

```js
/**
 * ABOUTME: Tests for deciding which post files to upload, skip, or flag as CDN name collisions.
 * ABOUTME: Pure logic over the CDN listing; one test per row of the spec's classification table.
 *
 * @jest-environment node
 */

import { planUploads } from '@/lib/publish/PublishPlanner';

const file = (name, checksum = 'SAME') => ({ path: `images/${name}`, name, checksum });
const names = (files) => files.map(f => f.name);

function plan(files, listing, { owned = [], force = false } = {}) {
    return planUploads({ files, listing: new Map(Object.entries(listing)), ownedNames: new Set(owned), force });
}

test('a file not on the CDN is uploaded', () => {
    expect(names(plan([file('a.jpg')], {}).upload)).toEqual(['a.jpg']);
});

test('a file with the same checksum is skipped', () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'SAME' });

    expect(names(result.skip)).toEqual(['a.jpg']);
    expect(result.upload).toEqual([]);
});

test("a changed file that is one of this entry's attachments is uploaded", () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'OTHER' }, { owned: ['a.jpg'] });

    expect(names(result.upload)).toEqual(['a.jpg']);
    expect(result.collision).toEqual([]);
});

test("a different file with the same name as another post's is a collision", () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'OTHER' });

    expect(names(result.collision)).toEqual(['a.jpg']);
    expect(result.upload).toEqual([]);
});

test('a CDN file with no checksum counts as different', () => {
    expect(names(plan([file('a.jpg')], { 'a.jpg': null }).collision)).toEqual(['a.jpg']);
});

test('--force turns collisions into uploads and reports them as forced', () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'OTHER' }, { force: true });

    expect(names(result.upload)).toEqual(['a.jpg']);
    expect(names(result.forced)).toEqual(['a.jpg']);
    expect(result.collision).toEqual([]);
});

test('sorts a mix of files into their buckets', () => {
    const result = plan(
        [file('new.jpg'), file('same.jpg'), file('mine.jpg'), file('theirs.jpg')],
        { 'same.jpg': 'SAME', 'mine.jpg': 'OLD', 'theirs.jpg': 'OLD' },
        { owned: ['mine.jpg'] }
    );

    expect(names(result.upload)).toEqual(['new.jpg', 'mine.jpg']);
    expect(names(result.skip)).toEqual(['same.jpg']);
    expect(names(result.collision)).toEqual(['theirs.jpg']);
    expect(result.forced).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/PublishPlanner.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/PublishPlanner'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/PublishPlanner.js`:

```js
// ABOUTME: Decides, for each file in a post folder, whether to upload it, skip it, or stop on a collision.
// ABOUTME: Compares local checksums against the CDN listing and the files this post already owns.

/**
 * @param files {Array<{name: string, checksum: string}>}
 * @param listing {Map<string, (string|null)>} CDN file name → checksum
 * @param ownedNames {Set<string>} file names already recorded as this entry's attachments
 * @param force {boolean} overwrite files that belong to other posts
 */
export function planUploads({ files, listing, ownedNames, force }) {
    const plan = { upload: [], skip: [], collision: [], forced: [] };
    for (const file of files) {
        if (!listing.has(file.name)) {
            plan.upload.push(file);
        } else if (listing.get(file.name) === file.checksum) {
            plan.skip.push(file);
        } else if (ownedNames.has(file.name)) {
            plan.upload.push(file);
        } else if (force) {
            plan.upload.push(file);
            plan.forced.push(file);
        } else {
            plan.collision.push(file);
        }
    }
    return plan;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/PublishPlanner.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/publish/PublishPlanner.js __tests__/lib/publish/PublishPlanner.test.js
git commit -m "BLOG-POST-PUBLISHER: plan uploads and detect CDN name collisions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Database writer

**Files:**
- Create: `lib/publish/PostWriter.js`
- Create: `__tests__/lib/publish/support/fakeDatabase.js`
- Test: `__tests__/lib/publish/PostWriter.test.js`

**Interfaces:**
- Consumes: `PublishError` (Task 1); `PostRecord` (Task 5).
- Produces: default export `class PostWriter`:
  - `constructor({ pool })` — `pool` is a `pg.Pool` or anything with `query(sql, params)` and `connect()` returning a client with `query(sql, params)` and `release()`.
  - `async findEntry(entryId: number): Promise<{ entryId: number, attachmentNames: Set<string> } | null>`
  - `async write(record: PostRecord): Promise<number>` — returns the entry ID; inserts when `record.entryId` is null, updates otherwise.
- Produces, from `__tests__/lib/publish/support/fakeDatabase.js`: `fakeDatabase({ maxEntryId?, maxAttachmentId?, maxTagId?, tags?: {name: id}, entries?: {[entryId]: string[] /* attachment file names */}, failures?: Array<{ match: RegExp, error: Error }> })` → `{ pool, statements: Array<{sql, params}>, sql(): string[], releases(): number }`. SQL in `statements` has whitespace collapsed to single spaces. Each failure is thrown once, by the first statement it matches.

- [ ] **Step 1: Write the test helper**

Create `__tests__/lib/publish/support/fakeDatabase.js`:

```js
// ABOUTME: In-memory stand-in for a pg Pool, answering the statements PostWriter issues.
// ABOUTME: Records every statement so tests can check what was sent, and can inject failures.

export function fakeDatabase({
    maxEntryId = 3420,
    maxAttachmentId = 2929,
    maxTagId = 40,
    tags = {},
    entries = {},
    failures = []
} = {}) {
    const statements = [];
    const pending = [...failures];
    let releases = 0;

    async function query(sql, params = []) {
        const text = sql.replace(/\s+/g, ' ').trim();
        statements.push({ sql: text, params });

        const failure = pending.findIndex(f => f.match.test(text));
        if (failure >= 0) {
            throw pending.splice(failure, 1)[0].error;
        }
        if (text.startsWith('SELECT COALESCE(MAX(entry_id), 0) + 1')) {
            return { rows: [{ next_id: String(maxEntryId + 1) }], rowCount: 1 };
        }
        if (text.includes('MAX(attachment_id)')) {
            return { rows: [{ max_id: String(maxAttachmentId) }], rowCount: 1 };
        }
        if (text.includes('MAX(tag_id)')) {
            return { rows: [{ max_id: String(maxTagId) }], rowCount: 1 };
        }
        if (text.startsWith('SELECT tag_id, name FROM tags')) {
            const rows = params[0].filter(name => name in tags).map(name => ({ tag_id: tags[name], name }));
            return { rows, rowCount: rows.length };
        }
        if (text.startsWith('SELECT entry_id FROM blog_entries')) {
            const rows = params[0] in entries ? [{ entry_id: params[0] }] : [];
            return { rows, rowCount: rows.length };
        }
        if (text.startsWith('SELECT file_name FROM attachments')) {
            const rows = (entries[params[0]] ?? []).map(file_name => ({ file_name }));
            return { rows, rowCount: rows.length };
        }
        if (text.startsWith('UPDATE blog_entries')) {
            return { rows: [], rowCount: params[0] in entries ? 1 : 0 };
        }
        return { rows: [], rowCount: 1 };
    }

    const pool = {
        query,
        connect: async () => ({ query, release: () => { releases += 1; } })
    };

    return {
        pool,
        statements,
        sql: () => statements.map(s => s.sql),
        releases: () => releases
    };
}
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/lib/publish/PostWriter.test.js`:

```js
/**
 * ABOUTME: Tests for the publisher's database writes: entry insert or update, attachments, tags, retry.
 * ABOUTME: Runs against the in-memory fakeDatabase; no real database.
 *
 * @jest-environment node
 */

import PostWriter from '@/lib/publish/PostWriter';
import PublishError from '@/lib/publish/PublishError';
import { fakeDatabase } from './support/fakeDatabase';

const record = (overrides = {}) => ({
    entryId: null,
    title: 'My Trip',
    intro: '<p>i</p>',
    body: null,
    datePosted: '2026-10-03 14:30:00',
    lastUpdated: '2026-10-03 14:31:07',
    imageFileName: 'hero.jpg',
    imageFileType: 1,
    viaUrl: null,
    viaTitle: null,
    viaText: null,
    userId: 1,
    userName: 'Chris',
    tags: [],
    attachments: [],
    ...overrides
});

const retryable = () => Object.assign(new Error('restart transaction'), { code: '40001' });
const count = (db, sql) => db.sql().filter(s => s === sql).length;
const paramsOf = (db, prefix) => db.statements.filter(s => s.sql.startsWith(prefix)).map(s => s.params);

describe('findEntry', () => {
    test('returns null when the entry does not exist', async () => {
        const db = fakeDatabase();

        expect(await new PostWriter({ pool: db.pool }).findEntry(9999)).toBeNull();
    });

    test("returns an existing entry's attachment file names", async () => {
        const db = fakeDatabase({ entries: { 3421: ['hero.jpg', 'route.pdf'] } });

        expect(await new PostWriter({ pool: db.pool }).findEntry(3421)).toEqual({
            entryId: 3421,
            attachmentNames: new Set(['hero.jpg', 'route.pdf'])
        });
    });
});

describe('write', () => {
    test('a new post gets MAX(entry_id) + 1 and is inserted inside a transaction', async () => {
        const db = fakeDatabase({ maxEntryId: 3420 });

        const entryId = await new PostWriter({ pool: db.pool }).write(record());

        expect(entryId).toBe(3421);
        expect(db.sql()[0]).toBe('BEGIN');
        expect(db.sql().at(-1)).toBe('COMMIT');
        expect(paramsOf(db, 'INSERT INTO blog_entries')).toEqual([[
            3421, 'My Trip', '<p>i</p>', null, '2026-10-03 14:30:00', '2026-10-03 14:31:07',
            'hero.jpg', 1, null, null, null, 1, 'Chris'
        ]]);
        expect(db.sql().some(s => s.startsWith('UPDATE'))).toBe(false);
    });

    test('an existing post is updated in place', async () => {
        const db = fakeDatabase({ entries: { 3421: [] } });

        const entryId = await new PostWriter({ pool: db.pool }).write(record({ entryId: 3421 }));

        expect(entryId).toBe(3421);
        expect(paramsOf(db, 'UPDATE blog_entries')).toEqual([[
            3421, 'My Trip', '<p>i</p>', null, '2026-10-03 14:30:00', '2026-10-03 14:31:07',
            'hero.jpg', 1, null, null, null
        ]]);
        expect(paramsOf(db, 'INSERT INTO blog_entries')).toEqual([]);
    });

    test('updating an entry that does not exist rolls back with a PublishError', async () => {
        const db = fakeDatabase();

        await expect(new PostWriter({ pool: db.pool }).write(record({ entryId: 3421 }))).rejects.toThrow(PublishError);
        expect(count(db, 'ROLLBACK')).toBe(1);
        expect(count(db, 'COMMIT')).toBe(0);
    });

    test("replaces the entry's attachments with freshly numbered rows", async () => {
        const db = fakeDatabase({ entries: { 3421: ['old.jpg'] }, maxAttachmentId: 2929 });

        await new PostWriter({ pool: db.pool }).write(record({
            entryId: 3421,
            attachments: [
                { fileName: 'hero.jpg', fileType: 'image', mimeType: 'image/jpeg', title: 'Halls Lake', description: 'Camp', isGallery: true },
                { fileName: 'route.pdf', fileType: 'document', mimeType: 'application/pdf', title: 'route.pdf', description: null, isGallery: false }
            ]
        }));

        const sql = db.sql();
        const deleteAt = sql.indexOf('DELETE FROM attachments WHERE entry_id = $1');
        const firstInsertAt = sql.findIndex(s => s.startsWith('INSERT INTO attachments'));
        expect(deleteAt).toBeGreaterThan(-1);
        expect(deleteAt).toBeLessThan(firstInsertAt);
        expect(paramsOf(db, 'DELETE FROM attachments')).toEqual([[3421]]);
        expect(paramsOf(db, 'INSERT INTO attachments')).toEqual([
            [2930, 3421, 'hero.jpg', 'image', 'image/jpeg', 'Halls Lake', 'Camp', 'true', '2026-10-03 14:30:00', 1, 'Chris'],
            [2931, 3421, 'route.pdf', 'document', 'application/pdf', 'route.pdf', null, 'false', '2026-10-03 14:30:00', 1, 'Chris']
        ]);
    });

    test('with no attachments, only clears the old rows', async () => {
        const db = fakeDatabase({ entries: { 3421: ['old.jpg'] } });

        await new PostWriter({ pool: db.pool }).write(record({ entryId: 3421 }));

        expect(paramsOf(db, 'DELETE FROM attachments')).toEqual([[3421]]);
        expect(db.sql().some(s => s.includes('MAX(attachment_id)'))).toBe(false);
    });

    test('reuses existing tags, creates missing ones, and replaces the tag links', async () => {
        const db = fakeDatabase({ entries: { 3421: [] }, tags: { bikes: 7 }, maxTagId: 40 });

        await new PostWriter({ pool: db.pool }).write(record({ entryId: 3421, tags: ['bikes', 'mtb'] }));

        expect(paramsOf(db, 'DELETE FROM tag_links')).toEqual([[3421]]);
        expect(paramsOf(db, 'INSERT INTO tags')).toEqual([[41, 'mtb']]);
        expect(paramsOf(db, 'INSERT INTO tag_links')).toEqual([[3421, 7], [3421, 41]]);
    });

    test('retries the whole transaction on a CockroachDB retry error', async () => {
        const db = fakeDatabase({ failures: [{ match: /^INSERT INTO blog_entries/, error: retryable() }] });

        const entryId = await new PostWriter({ pool: db.pool }).write(record());

        expect(entryId).toBe(3421);
        expect(count(db, 'BEGIN')).toBe(2);
        expect(count(db, 'ROLLBACK')).toBe(1);
        expect(count(db, 'COMMIT')).toBe(1);
        expect(db.releases()).toBe(2);
    });

    test('gives up after three attempts', async () => {
        const failures = [1, 2, 3].map(() => ({ match: /^INSERT INTO blog_entries/, error: retryable() }));
        const db = fakeDatabase({ failures });

        await expect(new PostWriter({ pool: db.pool }).write(record())).rejects.toMatchObject({ code: '40001' });
        expect(count(db, 'BEGIN')).toBe(3);
        expect(count(db, 'COMMIT')).toBe(0);
    });

    test('does not retry other errors', async () => {
        const db = fakeDatabase({ failures: [{ match: /^INSERT INTO blog_entries/, error: new Error('boom') }] });

        await expect(new PostWriter({ pool: db.pool }).write(record())).rejects.toThrow('boom');
        expect(count(db, 'BEGIN')).toBe(1);
        expect(db.releases()).toBe(1);
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/PostWriter.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/PostWriter'`.

- [ ] **Step 4: Write minimal implementation**

Create `lib/publish/PostWriter.js`:

```js
// ABOUTME: Reads and writes blog posts in the database on behalf of the publisher.
// ABOUTME: Writes each post in one transaction, retrying when CockroachDB asks the client to.

import PublishError from './PublishError.js';

/** SQLSTATE CockroachDB returns when a transaction must be retried by the client. */
const RETRY_ERROR = '40001';
const MAX_ATTEMPTS = 3;

export default class PostWriter {
    #pool;

    /**
     * @param pool {{query: Function, connect: Function}} a pg Pool
     */
    constructor({ pool }) {
        this.#pool = pool;
    }

    /**
     * @returns {Promise<{entryId: number, attachmentNames: Set<string>}|null>}
     */
    async findEntry(entryId) {
        const entries = await this.#pool.query('SELECT entry_id FROM blog_entries WHERE entry_id = $1', [entryId]);
        if (entries.rows.length === 0) {
            return null;
        }
        const attachments = await this.#pool.query('SELECT file_name FROM attachments WHERE entry_id = $1', [entryId]);
        return { entryId, attachmentNames: new Set(attachments.rows.map(row => row.file_name)) };
    }

    /**
     * Inserts or updates the entry, then replaces its attachments and tags, all in one transaction.
     *
     * @returns {Promise<number>} the entry's ID
     */
    async write(record) {
        for (let attempt = 1; ; attempt += 1) {
            const client = await this.#pool.connect();
            try {
                await client.query('BEGIN');
                const entryId = await this.#writeEntry(client, record);
                await this.#replaceAttachments(client, entryId, record);
                await this.#replaceTags(client, entryId, record.tags);
                await client.query('COMMIT');
                return entryId;
            } catch (error) {
                await client.query('ROLLBACK').catch(() => {});
                if (error.code !== RETRY_ERROR || attempt >= MAX_ATTEMPTS) {
                    throw error;
                }
            } finally {
                client.release();
            }
        }
    }

    async #writeEntry(client, record) {
        const values = [
            record.title, record.intro, record.body, record.datePosted, record.lastUpdated,
            record.imageFileName, record.imageFileType, record.viaUrl, record.viaTitle, record.viaText
        ];
        if (record.entryId == null) {
            // entry_id has no default or sequence. CockroachDB transactions are serializable,
            // so a concurrent publish that read the same MAX forces one of them to retry.
            const { rows } = await client.query('SELECT COALESCE(MAX(entry_id), 0) + 1 AS next_id FROM blog_entries');
            const entryId = Number(rows[0].next_id);
            await client.query(
                `INSERT INTO blog_entries (entry_id, title, intro, body, date_posted, last_updated,
                    image_file_name, image_file_type, via_url, via_title, via_text,
                    allow_comments, syndicate, user_id, user_name)
                 VALUES ($1, $2, $3, $4, $5::TIMESTAMP, $6::TIMESTAMP, $7, $8, $9, $10, $11, 'false', 'false', $12, $13)`,
                [entryId, ...values, record.userId, record.userName]
            );
            return entryId;
        }
        const result = await client.query(
            `UPDATE blog_entries SET title = $2, intro = $3, body = $4, date_posted = $5::TIMESTAMP,
                last_updated = $6::TIMESTAMP, image_file_name = $7, image_file_type = $8,
                via_url = $9, via_title = $10, via_text = $11
             WHERE entry_id = $1`,
            [record.entryId, ...values]
        );
        if (result.rowCount !== 1) {
            throw new PublishError(`Entry ${record.entryId} from post.json does not exist in the database.`);
        }
        return record.entryId;
    }

    async #replaceAttachments(client, entryId, record) {
        await client.query('DELETE FROM attachments WHERE entry_id = $1', [entryId]);
        if (record.attachments.length === 0) {
            return;
        }
        const { rows } = await client.query('SELECT COALESCE(MAX(attachment_id), 0) AS max_id FROM attachments');
        let attachmentId = Number(rows[0].max_id);
        for (const attachment of record.attachments) {
            attachmentId += 1;
            await client.query(
                `INSERT INTO attachments (attachment_id, entry_id, file_name, file_type, mime_type, title,
                    description, is_gallery_image, date_posted, user_id, user_name)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::TIMESTAMP, $10, $11)`,
                [
                    attachmentId, entryId, attachment.fileName, attachment.fileType, attachment.mimeType,
                    attachment.title, attachment.description, attachment.isGallery ? 'true' : 'false',
                    record.datePosted, record.userId, record.userName
                ]
            );
        }
    }

    async #replaceTags(client, entryId, tags) {
        await client.query('DELETE FROM tag_links WHERE object_id = $1', [entryId]);
        if (tags.length === 0) {
            return;
        }
        const { rows } = await client.query('SELECT tag_id, name FROM tags WHERE name = ANY($1)', [tags]);
        const tagIds = new Map(rows.map(row => [row.name, row.tag_id]));
        const missing = tags.filter(name => !tagIds.has(name));
        if (missing.length > 0) {
            const max = await client.query('SELECT COALESCE(MAX(tag_id), 0) AS max_id FROM tags');
            let tagId = Number(max.rows[0].max_id);
            for (const name of missing) {
                tagId += 1;
                await client.query('INSERT INTO tags (tag_id, name) VALUES ($1, $2)', [tagId, name]);
                tagIds.set(name, tagId);
            }
        }
        for (const name of tags) {
            await client.query('INSERT INTO tag_links (object_id, tag_id) VALUES ($1, $2)', [entryId, tagIds.get(name)]);
        }
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/PostWriter.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/publish/PostWriter.js __tests__/lib/publish/support/fakeDatabase.js __tests__/lib/publish/PostWriter.test.js
git commit -m "BLOG-POST-PUBLISHER: write posts, attachments and tags in one transaction" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Publisher orchestration

**Files:**
- Create: `lib/publish/Publisher.js`
- Test: `__tests__/lib/publish/Publisher.test.js`

**Interfaces:**
- Consumes: `readPostFolder`, `writeBack`, `sha256` (Task 2); `validatePostFolder` (Task 4); `buildPostRecord` (Task 5); `formatLocalMinute`, `formatLocalSecond` (Task 5); `planUploads` (Task 7); `PublishError` (Task 1). Collaborators are injected: `cdn` with `list()`/`upload()` (Task 6 shape), `writer` with `findEntry()`/`write()` (Task 8 shape).
- Produces:
  - default export `class Publisher` with `constructor({ cdn, writer, confirm: (question: string) => Promise<boolean>, log: (line: string) => void, now?: () => Date })` and `async publish(dir: string, { dryRun?: boolean, force?: boolean, yes?: boolean } = {}): Promise<{ status: 'published'|'dry-run'|'cancelled', entryId?: number, plan }>`
  - `export function describePlan(record: PostRecord, plan): string`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/Publisher.test.js`:

```js
/**
 * ABOUTME: Tests for the publish sequence: validate, plan, confirm, upload, write, write back.
 * ABOUTME: Real temporary post folders, with in-memory fakes for the CDN and the database writer.
 *
 * @jest-environment node
 */

import fs from 'node:fs';
import path from 'node:path';
import Publisher from '@/lib/publish/Publisher';
import PublishError from '@/lib/publish/PublishError';
import { sha256 } from '@/lib/publish/PostFolder';
import { makePostFolder, removeFolder } from './support/postFixture';

const NOW = new Date(2026, 9, 3, 14, 30, 7);

function fakeCdn(listing = {}) {
    return {
        listing: new Map(Object.entries(listing)),
        uploads: [],
        async list() {
            return this.listing;
        },
        async upload(name, bytes, contentType) {
            this.uploads.push({ name, bytes: Buffer.from(bytes).toString(), contentType });
        }
    };
}

function fakeWriter(entries = {}) {
    return {
        records: [],
        async findEntry(entryId) {
            return entryId in entries ? { entryId, attachmentNames: new Set(entries[entryId]) } : null;
        },
        async write(record) {
            this.records.push(record);
            return record.entryId ?? 3421;
        }
    };
}

function setup({ cdn = fakeCdn(), writer = fakeWriter(), answer = true } = {}) {
    const log = [];
    const confirm = jest.fn(async () => answer);
    const publisher = new Publisher({ cdn, writer, confirm, log: line => log.push(line), now: () => NOW });
    return { publisher, cdn, writer, confirm, log };
}

const readPost = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8'));

let dir;

afterEach(() => {
    if (dir) {
        removeFolder(dir);
        dir = null;
    }
});

test('publishes a new post: uploads, writes, and records the entry in post.json', async () => {
    dir = makePostFolder({
        post: { title: 'My Trip', datePosted: null, entryId: null },
        intro: '<img src="images/hero.jpg">',
        files: { 'images/hero.jpg': 'jpg' }
    });
    const { publisher, cdn, writer } = setup();

    const result = await publisher.publish(dir);

    expect(result).toMatchObject({ status: 'published', entryId: 3421 });
    expect(cdn.uploads).toEqual([{ name: 'hero.jpg', bytes: 'jpg', contentType: 'image/jpeg' }]);
    expect(writer.records[0]).toMatchObject({
        entryId: null,
        intro: '<img src="https://raserio.b-cdn.net/hero.jpg">',
        datePosted: '2026-10-03 14:30:00',
        lastUpdated: '2026-10-03 14:30:07'
    });
    expect(readPost(dir)).toMatchObject({ entryId: 3421, datePosted: '2026-10-03 14:30' });
});

test('keeps a datePosted that post.json already has', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', datePosted: '2020-01-02 03:04' } });
    const { publisher, writer } = setup();

    await publisher.publish(dir);

    expect(writer.records[0].datePosted).toBe('2020-01-02 03:04:00');
    expect(readPost(dir).datePosted).toBe('2020-01-02 03:04');
});

test('re-publishing an unchanged post skips its files and updates the same entry', async () => {
    dir = makePostFolder({
        post: { title: 'My Trip', datePosted: '2026-10-03 14:30', entryId: 3421 },
        files: { 'images/hero.jpg': 'jpg' }
    });
    const { publisher, cdn, writer } = setup({
        cdn: fakeCdn({ 'hero.jpg': sha256(Buffer.from('jpg')) }),
        writer: fakeWriter({ 3421: ['hero.jpg'] })
    });

    const result = await publisher.publish(dir);

    expect(cdn.uploads).toEqual([]);
    expect(writer.records[0].entryId).toBe(3421);
    expect(result.entryId).toBe(3421);
});

test('validation problems stop everything and are all reported', async () => {
    dir = makePostFolder({ post: { title: '' } });
    const { publisher, cdn, writer } = setup();

    await expect(publisher.publish(dir)).rejects.toMatchObject({
        name: 'PublishError',
        details: [expect.stringContaining('"title"')]
    });
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
});

test('an entryId with no matching entry is refused rather than duplicated', async () => {
    dir = makePostFolder({ post: { title: 'My Trip', entryId: 9999 } });
    const { publisher, writer } = setup();

    await expect(publisher.publish(dir)).rejects.toThrow(/no such entry/);
    expect(writer.records).toEqual([]);
});

test('collisions stop the run before any file is uploaded', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'new', 'images/other.jpg': 'o' } });
    const { publisher, cdn, writer } = setup({ cdn: fakeCdn({ 'hero.jpg': 'DIFFERENT' }) });

    await expect(publisher.publish(dir)).rejects.toMatchObject({
        details: [expect.stringContaining('hero.jpg')]
    });
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
});

test('--force overwrites colliding files', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'new', 'images/other.jpg': 'o' } });
    const { publisher, cdn, log } = setup({ cdn: fakeCdn({ 'hero.jpg': 'DIFFERENT' }) });

    const result = await publisher.publish(dir, { force: true });

    expect(result.status).toBe('published');
    expect(cdn.uploads.map(u => u.name)).toEqual(['hero.jpg', 'other.jpg']);
    expect(log.join('\n')).toContain('upload: hero.jpg (overwrites existing file, --force)');
});

test('a dry run changes nothing and does not ask', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'jpg' } });
    const before = fs.readFileSync(path.join(dir, 'post.json'), 'utf-8');
    const { publisher, cdn, writer, confirm, log } = setup();

    const result = await publisher.publish(dir, { dryRun: true });

    expect(result.status).toBe('dry-run');
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
    expect(confirm).not.toHaveBeenCalled();
    expect(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8')).toBe(before);
    expect(log.join('\n')).toContain('New entry: "My Trip"');
});

test('declined confirmation cancels with nothing uploaded, written or changed', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'jpg' } });
    const before = fs.readFileSync(path.join(dir, 'post.json'), 'utf-8');
    const { publisher, cdn, writer, confirm } = setup({ answer: false });

    const result = await publisher.publish(dir);

    expect(confirm).toHaveBeenCalledWith('Publish "My Trip" (new entry) with 1 files to raser.io?');
    expect(result.status).toBe('cancelled');
    expect(cdn.uploads).toEqual([]);
    expect(writer.records).toEqual([]);
    expect(fs.readFileSync(path.join(dir, 'post.json'), 'utf-8')).toBe(before);
});

test('--yes publishes without asking', async () => {
    dir = makePostFolder();
    const { publisher, confirm } = setup({ answer: false });

    const result = await publisher.publish(dir, { yes: true });

    expect(confirm).not.toHaveBeenCalled();
    expect(result.status).toBe('published');
});

test('a failed upload stops before the database is touched', async () => {
    dir = makePostFolder({ files: { 'images/hero.jpg': 'jpg' } });
    const cdn = fakeCdn();
    cdn.upload = async () => {
        throw new PublishError('Upload of hero.jpg failed: HTTP 500.');
    };
    const { publisher, writer } = setup({ cdn });

    await expect(publisher.publish(dir)).rejects.toThrow(/HTTP 500/);
    expect(writer.records).toEqual([]);
});

test('if post.json cannot be updated after the write, the error gives the new entryId', async () => {
    dir = makePostFolder();
    const writer = fakeWriter();
    writer.write = async () => {
        fs.rmSync(dir, { recursive: true, force: true });
        return 3421;
    };
    const { publisher } = setup({ writer });

    await expect(publisher.publish(dir)).rejects.toThrow(/"entryId": 3421/);
});

test('the plan lists uploads, unchanged files and tags', async () => {
    dir = makePostFolder({
        post: { title: 'My Trip', entryId: 3421, tags: ['bikes', 'mtb'] },
        files: { 'images/new.jpg': 'n', 'images/same.jpg': 's' }
    });
    const { publisher, log } = setup({
        cdn: fakeCdn({ 'same.jpg': sha256(Buffer.from('s')) }),
        writer: fakeWriter({ 3421: ['same.jpg'] })
    });

    await publisher.publish(dir, { dryRun: true });

    const text = log.join('\n');
    expect(text).toContain('Update entry 3421: "My Trip"');
    expect(text).toContain('upload: new.jpg');
    expect(text).toContain('unchanged: same.jpg');
    expect(text).toContain('tags: bikes, mtb');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/Publisher.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/Publisher'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/Publisher.js`:

```js
// ABOUTME: Runs a publish: validate the folder, plan uploads, confirm, upload, write the post, record the result.
// ABOUTME: Each step finishes before the next starts, so a failure never leaves the database pointing at missing files.

import fs from 'node:fs';
import { readPostFolder, writeBack } from './PostFolder.js';
import { buildPostRecord } from './postRecord.js';
import { planUploads } from './PublishPlanner.js';
import PublishError from './PublishError.js';
import { formatLocalMinute, formatLocalSecond } from './timestamps.js';
import { validatePostFolder } from './validate.js';

export default class Publisher {
    #cdn;
    #writer;
    #confirm;
    #log;
    #now;

    /**
     * @param cdn {{list: Function, upload: Function}} a CdnStore
     * @param writer {{findEntry: Function, write: Function}} a PostWriter
     * @param confirm {function(string): Promise<boolean>} asks the user a yes/no question
     * @param log {function(string)} prints a line of progress
     * @param now {function(): Date}
     */
    constructor({ cdn, writer, confirm, log, now = () => new Date() }) {
        this.#cdn = cdn;
        this.#writer = writer;
        this.#confirm = confirm;
        this.#log = log;
        this.#now = now;
    }

    async publish(dir, { dryRun = false, force = false, yes = false } = {}) {
        const folder = readPostFolder(dir);
        const errors = validatePostFolder(folder);
        if (errors.length > 0) {
            throw new PublishError(`${dir} has problems:`, errors);
        }
        const { post } = folder;

        const existing = post.entryId != null ? await this.#writer.findEntry(post.entryId) : null;
        if (post.entryId != null && !existing) {
            throw new PublishError(
                `post.json says entryId ${post.entryId}, but there is no such entry. Refusing to create a duplicate; `
                + 'fix entryId, or set it to null to publish as a new post.'
            );
        }

        const plan = planUploads({
            files: folder.files,
            listing: await this.#cdn.list(),
            ownedNames: existing ? existing.attachmentNames : new Set(),
            force
        });
        if (plan.collision.length > 0) {
            throw new PublishError(
                'These files would overwrite CDN files that belong to other posts. Rename them, or pass --force to overwrite:',
                plan.collision.map(file => `${file.path} → ${file.name}`)
            );
        }

        const now = this.#now();
        const datePosted = post.datePosted ?? formatLocalMinute(now);
        const record = buildPostRecord(folder, { entryId: post.entryId ?? null, datePosted, lastUpdated: formatLocalSecond(now) });
        this.#log(describePlan(record, plan));

        if (dryRun) {
            return { status: 'dry-run', plan };
        }
        const action = record.entryId == null ? 'new entry' : `update entry ${record.entryId}`;
        if (!yes && !(await this.#confirm(`Publish "${record.title}" (${action}) with ${folder.files.length} files to raser.io?`))) {
            return { status: 'cancelled', plan };
        }

        for (const file of plan.upload) {
            this.#log(`uploading ${file.name}`);
            await this.#cdn.upload(file.name, fs.readFileSync(file.absolutePath), file.mimeType);
        }
        const entryId = await this.#writer.write(record);
        try {
            writeBack(dir, { entryId, datePosted });
        } catch (error) {
            throw new PublishError(
                `Published as entry ${entryId}, but could not update post.json (${error.message}). `
                + `Set "entryId": ${entryId} and "datePosted": "${datePosted}" in post.json by hand, or the next run will create a duplicate.`
            );
        }
        return { status: 'published', entryId, plan };
    }
}

/**
 * The summary shown before confirming, and the whole output of a dry run.
 */
export function describePlan(record, plan) {
    const forced = new Set(plan.forced.map(file => file.name));
    const heading = record.entryId == null ? 'New entry' : `Update entry ${record.entryId}`;
    return [
        `${heading}: "${record.title}", dated ${record.datePosted}`,
        ...plan.upload.map(file => `  upload: ${file.name}${forced.has(file.name) ? ' (overwrites existing file, --force)' : ''}`),
        ...plan.skip.map(file => `  unchanged: ${file.name}`),
        ...(record.tags.length > 0 ? [`  tags: ${record.tags.join(', ')}`] : [])
    ].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/Publisher.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/publish/Publisher.js __tests__/lib/publish/Publisher.test.js
git commit -m "BLOG-POST-PUBLISHER: orchestrate validate, plan, confirm, upload and write" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: CLI helpers

**Files:**
- Create: `lib/publish/cli.js`
- Test: `__tests__/lib/publish/cli.test.js`

**Interfaces:**
- Produces, from `cli.js`:
  - `export const REQUIRED_ENV: string[]` — `['PUBLISH_DATABASE_URL', 'PUBLISH_BUNNY_STORAGE_HOST', 'PUBLISH_BUNNY_STORAGE_ZONE', 'PUBLISH_BUNNY_ACCESS_KEY']`
  - `export const RELAUNCH_MARKER = 'PUBLISH_RELAUNCHED'`
  - `export const USAGE: string`
  - `export function parseArgs(argv: string[]): { command: 'gen', name } | { command: 'publish', dir, dryRun, force, yes } | { command: 'usage', error?: string }`
  - `export function relaunchDecision(env: object): { action: 'run' } | { action: 'relaunch' } | { action: 'fail', missing: string[] }`
  - `export function relaunchCommand({ envFile, nodePath, execArgv, scriptPath, argv }): { command: 'op', args: string[] }`
  - `export function isYes(answer: string): boolean` — true only for `y` or `yes`, any case, surrounding whitespace ignored.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/publish/cli.test.js`:

```js
/**
 * ABOUTME: Tests for the blog-post command line helpers: arguments, the op run relaunch, yes/no answers.
 * ABOUTME: Pure functions; the entry script that uses them only wires them together.
 *
 * @jest-environment node
 */

import { parseArgs, relaunchDecision, relaunchCommand, isYes, REQUIRED_ENV, RELAUNCH_MARKER } from '@/lib/publish/cli';

describe('parseArgs', () => {
    test('--gen takes a folder name', () => {
        expect(parseArgs(['--gen', 'my-trip'])).toEqual({ command: 'gen', name: 'my-trip' });
    });

    test('a folder alone publishes with every flag off', () => {
        expect(parseArgs(['posts/my-trip'])).toEqual({ command: 'publish', dir: 'posts/my-trip', dryRun: false, force: false, yes: false });
    });

    test('flags may come before or after the folder', () => {
        expect(parseArgs(['--dry-run', 'posts/x', '--force', '--yes'])).toEqual({ command: 'publish', dir: 'posts/x', dryRun: true, force: true, yes: true });
    });

    test('--help asks for usage without an error', () => {
        expect(parseArgs(['--help'])).toEqual({ command: 'usage' });
    });

    test.each([
        [[]],
        [['posts/a', 'posts/b']],
        [['--gen']],
        [['--gen', '--dry-run']],
        [['--gen', 'x', 'posts/y']],
        [['--gen', 'x', '--force']],
        [['--bogus', 'posts/x']]
    ])('%p is a usage error', (argv) => {
        const result = parseArgs(argv);

        expect(result.command).toBe('usage');
        expect(result.error).toEqual(expect.any(String));
    });

    test('an unknown option is named in the error', () => {
        expect(parseArgs(['--bogus', 'posts/x']).error).toContain('--bogus');
    });
});

describe('relaunchDecision', () => {
    const complete = Object.fromEntries(REQUIRED_ENV.map(name => [name, 'value']));

    test('runs when every variable is set', () => {
        expect(relaunchDecision(complete)).toEqual({ action: 'run' });
    });

    test('relaunches under op run when variables are missing', () => {
        expect(relaunchDecision({})).toEqual({ action: 'relaunch' });
    });

    test('treats an empty value as missing', () => {
        expect(relaunchDecision({ ...complete, PUBLISH_BUNNY_ACCESS_KEY: '' })).toEqual({ action: 'relaunch' });
    });

    test('fails instead of relaunching twice, naming what op run did not supply', () => {
        const env = { ...complete, PUBLISH_DATABASE_URL: '', [RELAUNCH_MARKER]: '1' };

        expect(relaunchDecision(env)).toEqual({ action: 'fail', missing: ['PUBLISH_DATABASE_URL'] });
    });
});

describe('relaunchCommand', () => {
    test('re-runs this script with the same node flags and arguments under op run', () => {
        expect(relaunchCommand({
            envFile: '/repo/scripts/publish/publish.env',
            nodePath: '/usr/local/bin/node',
            execArgv: ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON'],
            scriptPath: '/repo/scripts/blog-post.js',
            argv: ['posts/x', '--dry-run']
        })).toEqual({
            command: 'op',
            args: [
                'run', '--env-file=/repo/scripts/publish/publish.env', '--',
                '/usr/local/bin/node', '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
                '/repo/scripts/blog-post.js', 'posts/x', '--dry-run'
            ]
        });
    });
});

describe('isYes', () => {
    test.each(['y', 'Y', 'yes', 'YES', ' yes '])('%p is yes', (answer) => {
        expect(isYes(answer)).toBe(true);
    });

    test.each(['', 'n', 'no', 'yep', 'y es'])('%p is not yes', (answer) => {
        expect(isYes(answer)).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/publish/cli.test.js`
Expected: FAIL — `Cannot find module '@/lib/publish/cli'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/publish/cli.js`:

```js
// ABOUTME: Command line helpers for `npm run blog-post`: argument parsing, the op run relaunch, yes/no answers.
// ABOUTME: Kept apart from scripts/blog-post.js so they can be unit tested.

export const REQUIRED_ENV = [
    'PUBLISH_DATABASE_URL',
    'PUBLISH_BUNNY_STORAGE_HOST',
    'PUBLISH_BUNNY_STORAGE_ZONE',
    'PUBLISH_BUNNY_ACCESS_KEY'
];

/** Set on the relaunched process, so a second missing-variable check fails instead of looping. */
export const RELAUNCH_MARKER = 'PUBLISH_RELAUNCHED';

export const USAGE = [
    'Usage:',
    '  npm run blog-post -- --gen <name>             create posts/<name>/ from the template',
    '  npm run blog-post -- <post-dir> [options]     publish a post folder to raser.io',
    '',
    'Options:',
    '  --dry-run   show what would happen; change nothing',
    '  --force     overwrite CDN files that belong to other posts',
    '  --yes       publish without asking for confirmation'
].join('\n');

const FLAGS = { '--dry-run': 'dryRun', '--force': 'force', '--yes': 'yes' };

export function parseArgs(argv) {
    const flags = { dryRun: false, force: false, yes: false };
    const positional = [];
    let gen = null;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--gen') {
            gen = argv[i + 1];
            i += 1;
            if (!gen || gen.startsWith('-')) {
                return usage('--gen needs a folder name.');
            }
        } else if (arg in FLAGS) {
            flags[FLAGS[arg]] = true;
        } else if (arg === '--help' || arg === '-h') {
            return { command: 'usage' };
        } else if (arg.startsWith('-')) {
            return usage(`Unknown option ${arg}.`);
        } else {
            positional.push(arg);
        }
    }

    if (gen !== null) {
        if (positional.length > 0 || Object.values(flags).some(Boolean)) {
            return usage('--gen takes only a folder name.');
        }
        return { command: 'gen', name: gen };
    }
    if (positional.length !== 1) {
        return usage('Give exactly one post folder.');
    }
    return { command: 'publish', dir: positional[0], ...flags };
}

export function relaunchDecision(env) {
    const missing = REQUIRED_ENV.filter(name => !env[name]);
    if (missing.length === 0) {
        return { action: 'run' };
    }
    if (env[RELAUNCH_MARKER]) {
        return { action: 'fail', missing };
    }
    return { action: 'relaunch' };
}

export function relaunchCommand({ envFile, nodePath, execArgv, scriptPath, argv }) {
    return {
        command: 'op',
        args: ['run', `--env-file=${envFile}`, '--', nodePath, ...execArgv, scriptPath, ...argv]
    };
}

export function isYes(answer) {
    return /^y(es)?$/i.test(answer.trim());
}

function usage(error) {
    return { command: 'usage', error };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/publish/cli.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/publish/cli.js __tests__/lib/publish/cli.test.js
git commit -m "BLOG-POST-PUBLISHER: argument parsing and op run relaunch decision" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Entry script, credentials wiring, role SQL, docs

**Files:**
- Create: `scripts/blog-post.js`
- Create: `scripts/publish/publish.env`
- Create: `scripts/publish/create-publisher-role.sql`
- Modify: `package.json` (add the `blog-post` script to `"scripts"`)
- Modify: `README.md` (append a "Publishing a post" section)

**Interfaces:**
- Consumes: everything in `lib/publish/` — `parseArgs`, `relaunchDecision`, `relaunchCommand`, `isYes`, `USAGE`, `RELAUNCH_MARKER` (Task 10); `createPostScaffold` (Task 1); `Publisher` (Task 9); `CdnStore` (Task 6); `PostWriter` (Task 8); `PublishError` (Task 1).
- Produces: `npm run blog-post`.

- [ ] **Step 1: Write the entry script**

Create `scripts/blog-post.js`:

```js
// ABOUTME: Command line entry point for `npm run blog-post`: scaffolds post folders and publishes them.
// ABOUTME: Gets credentials by re-running itself under `op run`; holds wiring only, the logic is in lib/publish.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import CdnStore from '../lib/publish/CdnStore.js';
import { isYes, parseArgs, relaunchCommand, relaunchDecision, RELAUNCH_MARKER, USAGE } from '../lib/publish/cli.js';
import { createPostScaffold } from '../lib/publish/PostScaffold.js';
import PostWriter from '../lib/publish/PostWriter.js';
import PublishError from '../lib/publish/PublishError.js';
import Publisher from '../lib/publish/Publisher.js';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const ENV_FILE = path.join(REPO_ROOT, 'scripts', 'publish', 'publish.env');
const POSTS_ROOT = path.join(REPO_ROOT, 'posts');

async function confirm(question) {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        return isYes(await prompt.question(`${question} [y/N] `));
    } finally {
        prompt.close();
    }
}

function relaunch(argv) {
    const { command, args } = relaunchCommand({
        envFile: ENV_FILE,
        nodePath: process.execPath,
        execArgv: process.execArgv,
        scriptPath: SCRIPT_PATH,
        argv
    });
    const result = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, [RELAUNCH_MARKER]: '1' } });
    if (result.error?.code === 'ENOENT') {
        console.error('The 1Password CLI ("op") is not installed: https://developer.1password.com/docs/cli/get-started/');
        return 1;
    }
    return result.status ?? 1;
}

async function publish({ dir, dryRun, force, yes }) {
    const pool = new pg.Pool({ connectionString: process.env.PUBLISH_DATABASE_URL });
    try {
        const publisher = new Publisher({
            cdn: new CdnStore({
                host: process.env.PUBLISH_BUNNY_STORAGE_HOST,
                zone: process.env.PUBLISH_BUNNY_STORAGE_ZONE,
                accessKey: process.env.PUBLISH_BUNNY_ACCESS_KEY
            }),
            writer: new PostWriter({ pool }),
            confirm,
            log: line => console.log(line)
        });
        const result = await publisher.publish(path.resolve(dir), { dryRun, force, yes });
        if (result.status === 'published') {
            console.log(`Published entry ${result.entryId}. It can take up to an hour to appear on raser.io.`);
        } else if (result.status === 'cancelled') {
            console.log('Cancelled; nothing changed.');
        } else {
            console.log('Dry run; nothing changed.');
        }
        return 0;
    } finally {
        await pool.end();
    }
}

async function main(argv) {
    const args = parseArgs(argv);
    if (args.command === 'usage') {
        if (args.error) {
            console.error(args.error);
        }
        console.error(USAGE);
        return args.error ? 2 : 0;
    }
    if (args.command === 'gen') {
        const dir = createPostScaffold(POSTS_ROOT, args.name);
        console.log(`Created ${path.relative(process.cwd(), dir)}/`);
        return 0;
    }
    const decision = relaunchDecision(process.env);
    if (decision.action === 'relaunch') {
        return relaunch(argv);
    }
    if (decision.action === 'fail') {
        console.error(`1Password did not supply ${decision.missing.join(', ')}. Check ${path.relative(process.cwd(), ENV_FILE)} against the 1Password item.`);
        return 1;
    }
    return publish(args);
}

main(process.argv.slice(2))
    .then((code) => {
        process.exitCode = code;
    })
    .catch((error) => {
        if (error instanceof PublishError) {
            console.error(error.message);
            for (const detail of error.details) {
                console.error(`  - ${detail}`);
            }
        } else {
            console.error(error.stack ?? error);
        }
        process.exitCode = 1;
    });
```

- [ ] **Step 2: Add the credential references, the role SQL and the npm script**

Create `scripts/publish/publish.env`:

```
# ABOUTME: 1Password references for the blog-post publisher, resolved by `op run`. Holds no secrets.
# ABOUTME: Edit the vault, item and field names to match the 1Password item.
PUBLISH_DATABASE_URL=op://Private/raser.io publisher/database_url
PUBLISH_BUNNY_STORAGE_HOST=op://Private/raser.io publisher/bunny_storage_host
PUBLISH_BUNNY_STORAGE_ZONE=op://Private/raser.io publisher/bunny_storage_zone
PUBLISH_BUNNY_ACCESS_KEY=op://Private/raser.io publisher/bunny_access_key
```

Create `scripts/publish/create-publisher-role.sql`:

```sql
-- ABOUTME: One-time setup of the blog_publisher database role used by `npm run blog-post`.
-- ABOUTME: Run by hand in the CockroachDB Cloud SQL shell; grants only what publishing needs.
--
-- Create the role here in SQL, not with the Cloud Console's "Add user" button: users made in
-- the console are given admin rights.
--
-- Before running: generate a password in 1Password, put it in place of the placeholder below,
-- and run the statements. Do not commit the real password. Then store the connection string,
-- postgresql://blog_publisher:<password>@<host>:26257/defaultdb?sslmode=verify-full,
-- in the 1Password item as database_url.

CREATE USER IF NOT EXISTS blog_publisher WITH PASSWORD 'paste-the-generated-password-here';

GRANT SELECT, INSERT, UPDATE ON TABLE blog_entries TO blog_publisher;
GRANT SELECT, INSERT, DELETE ON TABLE attachments TO blog_publisher;
GRANT SELECT, INSERT ON TABLE tags TO blog_publisher;
GRANT SELECT, INSERT, DELETE ON TABLE tag_links TO blog_publisher;
```

In `package.json`, add this entry to `"scripts"` (after `"test:coverage:open"`, adding a comma to the line before):

```json
"blog-post": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/blog-post.js"
```

- [ ] **Step 3: Smoke test the paths that need no credentials**

Run: `npm run blog-post -- --gen smoke-test`
Expected: prints `Created posts/smoke-test/`; `ls posts/smoke-test` shows `body.html docs images intro.html post.json`.

Run: `npm run blog-post -- --gen smoke-test`
Expected: exits non-zero, printing `.../posts/smoke-test already exists; not touching it.`

Run: `npm run blog-post -- --bogus`
Expected: prints `Unknown option --bogus.` and the usage text; exit code 2.

Run: `git status --short posts/`
Expected: no output (the folder is gitignored).

Run: `rm -rf posts/smoke-test`

If `node` reports `Cannot use import statement outside a module` or cannot resolve a `lib/publish` import, a file in `lib/publish/` is missing a `.js` extension on a relative import, or uses `@/` — fix the import; do not add `"type": "module"` to `package.json` (it would break the Next.js and Jest configs, which are CommonJS).

- [ ] **Step 4: Document the workflow**

Append to `README.md`:

````markdown
## Publishing a post

Posts are written as folders under `posts/` (gitignored) and published to production with
`npm run blog-post`.

```bash
# Create posts/my-trip/ with post.json, intro.html, body.html, images/ and docs/
npm run blog-post -- --gen my-trip

# Show what publishing would do, without changing anything
npm run blog-post -- posts/my-trip --dry-run

# Publish (asks for confirmation; --yes skips the question)
npm run blog-post -- posts/my-trip
```

- Reference files from the HTML by their folder path (`<img src="images/hero.jpg">`); the
  published post uses the CDN URL. Every file in `images/` and `docs/` is uploaded to the root of
  the CDN storage zone under its file name.
- A file whose name is already taken on the CDN by another post stops the run. Rename it, or
  pass `--force` to overwrite.
- The first publish writes `entryId` into `post.json`. Publishing the folder again updates that
  entry; unchanged files are not re-uploaded.
- New posts can take up to an hour to appear, since pages regenerate hourly.

Credentials come from 1Password, never from `.env` files: the script re-runs itself under
`op run --env-file=scripts/publish/publish.env`, which resolves the references in that file.
It needs the 1Password CLI (`op`) and an item holding `database_url`, `bunny_storage_host`,
`bunny_storage_zone` and `bunny_access_key`. The database user is `blog_publisher`, created once
with `scripts/publish/create-publisher-role.sql`.
````

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: all suites pass, including the existing ones. Every file under `lib/publish/` should show 100% or close to it in the coverage table; the PR's Coverage Enforcement check compares the total against `main`.

- [ ] **Step 6: Commit**

```bash
git add scripts/blog-post.js scripts/publish/publish.env scripts/publish/create-publisher-role.sql package.json README.md
git commit -m "BLOG-POST-PUBLISHER: npm run blog-post entry point, 1Password wiring and role setup" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Hand off the live checks to Chris**

These need production credentials and cannot be run by an agent. Report them as remaining manual steps:

1. Run `scripts/publish/create-publisher-role.sql` in the CockroachDB Cloud SQL shell, with a generated password.
2. Create the 1Password item "raser.io publisher" (vault "Private") with fields `database_url`, `bunny_storage_host`, `bunny_storage_zone`, `bunny_access_key`, or edit `scripts/publish/publish.env` to match an existing item.
3. `npm run blog-post -- --gen first-post`, fill it in, and run `npm run blog-post -- posts/first-post --dry-run`. Confirm the plan prints. This also confirms Bunny's listing works with these credentials; if files you know exist report as uploads rather than "unchanged" on a second dry run after publishing, the listing is not returning checksums.
