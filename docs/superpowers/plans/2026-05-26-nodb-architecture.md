# No-Database Blog Architecture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the external Heroku backend with local Next.js API routes reading from committed JSON data files; remove all write operations from DAO classes and delete all resulting dead code.

**Architecture:** A one-time migration script exports the MySQL dump to JSON files in `data/`. A server-side `BlogData` singleton loads and indexes these files in memory. New Next.js App Router API routes at `/api/entries/*` expose the same read interface the old backend provided. Pages using `getStaticProps` call `BlogData` directly (no HTTP round-trip needed at build time). Client-side components continue using `PostDao` + `CachingPostDao` unchanged — they now call the local `/api/entries/*` routes instead of Heroku.

**Tech Stack:** Next.js 14 App Router, Jest + Testing Library, Python 3 (migration script only)

---

## File Map

**Created:**
- `scripts/export-db-to-json.py` — one-time MySQL → JSON migration (run once, then commit output)
- `data/posts.json` — 3,203 blog entries with nested attachment metadata (generated)
- `data/comments.json` — 583 comments (generated)
- `data/tags.json` — 861 tag names (generated; no tag↔entry links exist in DB)
- `data/links.json` — 336 link-blog posts (generated; page feature TBD)
- `lib/data/BlogData.js` — server-only singleton: loads `data/posts.json`, sorts newest-first, indexes by entryId
- `app/api/entries/latest/[page]/route.js` — `GET /api/entries/latest/{page}?pageSize={n}`
- `app/api/entries/[id]/route.js` — `GET /api/entries/{id}`
- `app/api/entries/[id]/next/route.js` — `GET /api/entries/{id}/next`
- `app/api/entries/[id]/prev/route.js` — `GET /api/entries/{id}/prev`
- `app/api/entries/search/[numEntries]/route.js` — `GET /api/entries/search/{numEntries}`
- `__tests__/lib/data/BlogData.test.js`
- `__tests__/app/api/entries/latest.test.js`
- `__tests__/app/api/entries/entry.test.js`
- `__tests__/app/api/entries/next.test.js`
- `__tests__/app/api/entries/prev.test.js`
- `__tests__/app/api/entries/search.test.js`

**Modified:**
- `model/PostDao.js` — remove write methods (`createPost`, `publishPost`, `updatePost`, `deletePost`), remove helpers (`#sendPost`, `#auth`), remove factory methods `getEdgePostDao()` and `getPostDao()`
- `model/CachingPostDao.js` — remove write proxies (`createPost`, `publishPost`, `updatePost`)
- `siteconfig.json` — remove `api.endpoints.auth`, and write endpoints (`create`, `delete`, `publish`, `update`)
- `app/rss/route.js` — switch from `PostDao.getPostDao()` to `BlogData.getInstance()`
- `pages/index.js` — `getStaticProps` switches from PostDao HTTP call to `BlogData.getInstance()` direct call
- `pages/archive/index.jsx` — same
- `pages/archive/[postId].jsx` — `getStaticPaths` switches to `BlogData.getInstance()`
- `.env.local` — change `NEXT_PUBLIC_API_ROOT` from Heroku URL to `/api`

**Deleted:**
- `model/EdgeConfigPostDao.js` — no callers outside PostDao
- `components/EditPostView.jsx`
- `components/pages/EditPostPage.jsx`
- `components/pages/CreatePostPage.jsx`
- `components/DeleteLink.jsx`
- `pages/edit/[postId].js`
- `pages/create/index.jsx`

---

## Tasks

---

### Task 1: Export database to JSON files

**Files:**
- Create: `scripts/export-db-to-json.py`
- Create (generated): `data/posts.json`, `data/comments.json`, `data/tags.json`, `data/links.json`

- [ ] **Step 1: Create the export script**

Create `scripts/export-db-to-json.py`:

```python
#!/usr/bin/env python3
# ABOUTME: One-time migration script: exports raserio MySQL data to JSON files.
# ABOUTME: Reads database/raserio.sql, writes camelCase JSON to data/*.json.

import json
import os
import subprocess
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_FILE = os.path.join(PROJECT_ROOT, 'database', 'raserio.sql')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'data')
DB_NAME = 'raserio_export_tmp'


def snake_to_camel(name):
    parts = name.split('_')
    return parts[0] + ''.join(p.title() for p in parts[1:])


def strip_blobs(sql_path):
    """Return path to a copy of the SQL with attachment_bytes INSERT data removed."""
    out = '/tmp/raserio_noblobs.sql'
    in_blob = False
    with open(sql_path, 'r', encoding='utf-8', errors='replace') as fin, \
         open(out, 'w', encoding='utf-8') as fout:
        for line in fin:
            if 'LOCK TABLES `attachment_bytes` WRITE' in line:
                in_blob = True
                fout.write(line)
                continue
            if in_blob:
                if 'UNLOCK TABLES' in line:
                    in_blob = False
                    fout.write(line)
                continue
            fout.write(line)
    return out


def mysql_cmd(args, stdin_path=None):
    cmd = ['mysql', '-u', 'root'] + args
    with (open(stdin_path, 'rb') if stdin_path else open(os.devnull, 'rb')) as f:
        result = subprocess.run(cmd, stdin=f if stdin_path else None, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode())
    return result.stdout.decode()


def get_columns(db, table):
    out = mysql_cmd(['--batch', '--skip-column-names', db, '-e',
                     f'SHOW COLUMNS FROM `{table}`'])
    return [line.split('\t')[0] for line in out.strip().split('\n') if line]


def fetch_json(db, table, columns):
    """Fetch all rows as JSON using MySQL's JSON_ARRAYAGG — handles all escaping correctly."""
    pairs = ', '.join(f"'{snake_to_camel(c)}', `{c}`" for c in columns)
    query = f'SELECT JSON_ARRAYAGG(JSON_OBJECT({pairs})) FROM `{table}`'
    out = mysql_cmd(['--batch', '--raw', '--skip-column-names', db, '-e', query])
    out = out.strip()
    if not out or out == 'NULL':
        return []
    return json.loads(out)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print('Starting MySQL...')
    subprocess.run(['brew', 'services', 'start', 'mysql'], check=True)
    time.sleep(3)

    try:
        stripped = strip_blobs(SQL_FILE)
        print(f'Blob data stripped → {stripped}')

        mysql_cmd(['-e', f'DROP DATABASE IF EXISTS `{DB_NAME}`'])
        mysql_cmd(['-e', f'CREATE DATABASE `{DB_NAME}`'])
        print(f'Created database {DB_NAME}')

        mysql_cmd([DB_NAME], stdin_path=stripped)
        print('SQL imported')

        # Export blog_entries with attachments nested by entryId
        print('Fetching blog_entries...')
        entries = fetch_json(DB_NAME, 'blog_entries', get_columns(DB_NAME, 'blog_entries'))

        print('Fetching attachments...')
        attachments = fetch_json(DB_NAME, 'attachments', get_columns(DB_NAME, 'attachments'))

        att_by_entry = {}
        for att in attachments:
            att_by_entry.setdefault(att['entryId'], []).append(att)
        for entry in entries:
            entry['attachments'] = att_by_entry.get(entry['entryId'], [])

        posts_path = os.path.join(OUTPUT_DIR, 'posts.json')
        with open(posts_path, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False)
        print(f'Exported {len(entries)} entries → {posts_path}')

        # Export remaining tables
        for table in ('comments', 'tags', 'links'):
            rows = fetch_json(DB_NAME, table, get_columns(DB_NAME, table))
            out_path = os.path.join(OUTPUT_DIR, f'{table}.json')
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(rows, f, ensure_ascii=False)
            print(f'Exported {len(rows)} rows → {out_path}')

    finally:
        mysql_cmd(['-e', f'DROP DATABASE IF EXISTS `{DB_NAME}`'])
        subprocess.run(['brew', 'services', 'stop', 'mysql'])
        print('Done.')


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Run the export script**

```bash
python3 scripts/export-db-to-json.py
```

Expected output (row counts match the DB analysis):
```
Starting MySQL...
Blob data stripped → /tmp/raserio_noblobs.sql
Created database raserio_export_tmp
SQL imported
Fetching blog_entries...
Fetching attachments...
Exported 3203 entries → .../data/posts.json
Exported 583 rows → .../data/comments.json
Exported 861 rows → .../data/tags.json
Exported 336 rows → .../data/links.json
Done.
```

- [ ] **Step 3: Verify the output**

```bash
python3 -c "
import json
posts = json.load(open('data/posts.json'))
p = posts[0]
print(f'Total entries: {len(posts)}')
print(f'Sample field names: {list(p.keys())}')
print(f'attachments is list: {isinstance(p[\"attachments\"], list)}')
print(f'Sample entryId type: {type(p[\"entryId\"]).__name__}')
print(f'Sample datePosted: {p[\"datePosted\"]}')
print(f'comments: {len(json.load(open(\"data/comments.json\")))}')
print(f'tags: {len(json.load(open(\"data/tags.json\")))}')
print(f'links: {len(json.load(open(\"data/links.json\")))}')
"
```

Expected: 3203 entries, field names in camelCase (e.g. `entryId`, `datePosted`, `imageFileName`), `attachments` is a list.

- [ ] **Step 4: Add data/ to .gitignore exclusion (keep it tracked)**

Check `.gitignore` — if `data/` is listed, remove that line. The JSON files are the source of truth and must be committed.

- [ ] **Step 5: Commit**

```bash
git add scripts/export-db-to-json.py data/
git commit -m "feat(nodb): add DB export script and JSON data files"
```

---

### Task 2: Create BlogData server module

**Files:**
- Create: `lib/data/BlogData.js`
- Create: `__tests__/lib/data/BlogData.test.js`

Context: `BlogData` is a server-only singleton (uses Node.js `fs`). It sorts posts newest-first and provides O(1) lookup by entryId. "Next" means newer; "prev" means older.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/data/BlogData.test.js`:

```javascript
// ABOUTME: Tests for BlogData — the server-side in-memory blog data store.
// ABOUTME: Uses jest.resetModules() + jest.doMock() to inject test data without file I/O.

const MOCK_POSTS = [
    { entryId: '3', title: 'Newest', datePosted: '2023-01-03T00:00:00', attachments: [] },
    { entryId: '1', title: 'Oldest', datePosted: '2023-01-01T00:00:00', attachments: [] },
    { entryId: '2', title: 'Middle', datePosted: '2023-01-02T00:00:00', attachments: [] },
];

let BlogData;

beforeEach(() => {
    jest.resetModules();
    jest.doMock('fs', () => ({
        readFileSync: jest.fn().mockReturnValue(JSON.stringify(MOCK_POSTS)),
    }));
    jest.doMock('path', () => ({
        join: jest.fn().mockReturnValue('/mock/posts.json'),
    }));
    BlogData = require('@/lib/data/BlogData').default;
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('getInstance()', () => {
    test('returns a singleton', () => {
        const a = BlogData.getInstance();
        const b = BlogData.getInstance();
        expect(a).toBe(b);
    });
});

describe('getEntries()', () => {
    test('returns entries sorted newest-first', () => {
        const entries = BlogData.getInstance().getEntries(0, 10);
        expect(entries[0].entryId).toBe('3');
        expect(entries[1].entryId).toBe('2');
        expect(entries[2].entryId).toBe('1');
    });

    test('paginates correctly', () => {
        const data = BlogData.getInstance();
        const page0 = data.getEntries(0, 2);
        const page1 = data.getEntries(1, 2);
        expect(page0).toHaveLength(2);
        expect(page0[0].entryId).toBe('3');
        expect(page1).toHaveLength(1);
        expect(page1[0].entryId).toBe('1');
    });

    test('returns empty array past last page', () => {
        expect(BlogData.getInstance().getEntries(99, 10)).toHaveLength(0);
    });
});

describe('getPostById()', () => {
    test('finds post by string id', () => {
        expect(BlogData.getInstance().getPostById('2').title).toBe('Middle');
    });

    test('finds post by numeric id', () => {
        expect(BlogData.getInstance().getPostById(2).title).toBe('Middle');
    });

    test('returns null for unknown id', () => {
        expect(BlogData.getInstance().getPostById('999')).toBeNull();
    });
});

describe('getNextPost()', () => {
    test('returns the newer post', () => {
        // Sorted: [3(newest), 2(middle), 1(oldest)]
        // next of '2' (middle) is '3' (newer)
        expect(BlogData.getInstance().getNextPost('2').entryId).toBe('3');
    });

    test('returns null for the newest post', () => {
        expect(BlogData.getInstance().getNextPost('3')).toBeNull();
    });

    test('returns null for unknown id', () => {
        expect(BlogData.getInstance().getNextPost('999')).toBeNull();
    });
});

describe('getPrevPost()', () => {
    test('returns the older post', () => {
        // prev of '2' (middle) is '1' (older)
        expect(BlogData.getInstance().getPrevPost('2').entryId).toBe('1');
    });

    test('returns null for the oldest post', () => {
        expect(BlogData.getInstance().getPrevPost('1')).toBeNull();
    });

    test('returns null for unknown id', () => {
        expect(BlogData.getInstance().getPrevPost('999')).toBeNull();
    });
});

describe('getSearchStubs()', () => {
    test('returns up to numEntries posts, newest-first', () => {
        const stubs = BlogData.getInstance().getSearchStubs(2);
        expect(stubs).toHaveLength(2);
        expect(stubs[0].entryId).toBe('3');
    });

    test('returns all posts when numEntries exceeds total', () => {
        expect(BlogData.getInstance().getSearchStubs(1000)).toHaveLength(3);
    });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- BlogData.test.js
```

Expected: FAIL — `Cannot find module '@/lib/data/BlogData'`

- [ ] **Step 3: Implement BlogData**

Create `lib/data/BlogData.js`:

```javascript
// ABOUTME: Server-side singleton providing indexed, in-memory access to blog data.
// ABOUTME: Loaded from data/posts.json at first use; call BlogData.getInstance().

import fs from 'fs';
import path from 'path';

export default class BlogData {
    static #instance = null;

    #posts = [];
    #postsById = new Map();
    #postOrder = [];

    static getInstance() {
        if (!BlogData.#instance) {
            BlogData.#instance = new BlogData();
        }
        return BlogData.#instance;
    }

    constructor() {
        const filepath = path.join(process.cwd(), 'data', 'posts.json');
        const raw = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        this.#posts = [...raw].sort(
            (a, b) => new Date(b.datePosted) - new Date(a.datePosted)
        );
        this.#posts.forEach(post => {
            this.#postsById.set(String(post.entryId), post);
        });
        this.#postOrder = this.#posts.map(p => String(p.entryId));
    }

    getEntries(page = 0, pageSize = 10) {
        const start = page * pageSize;
        return this.#posts.slice(start, start + pageSize);
    }

    getPostById(id) {
        return this.#postsById.get(String(id)) ?? null;
    }

    // Returns the next (chronologically newer) post, or null if none.
    getNextPost(id) {
        const idx = this.#postOrder.indexOf(String(id));
        if (idx <= 0) return null;
        return this.getPostById(this.#postOrder[idx - 1]);
    }

    // Returns the previous (chronologically older) post, or null if none.
    getPrevPost(id) {
        const idx = this.#postOrder.indexOf(String(id));
        if (idx < 0 || idx >= this.#postOrder.length - 1) return null;
        return this.getPostById(this.#postOrder[idx + 1]);
    }

    getSearchStubs(numEntries = 1000) {
        return this.#posts.slice(0, numEntries);
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- BlogData.test.js
```

Expected: PASS (all 14 tests green)

- [ ] **Step 5: Commit**

```bash
git add lib/data/BlogData.js __tests__/lib/data/BlogData.test.js
git commit -m "feat(nodb): add BlogData server-side data module"
```

---

### Task 3: API route — paginated entries

**Files:**
- Create: `app/api/entries/latest/[page]/route.js`
- Create: `__tests__/app/api/entries/latest.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/app/api/entries/latest.test.js`:

```javascript
// ABOUTME: Tests for GET /api/entries/latest/[page] — paginated blog entries.
// ABOUTME: Verifies page index, pageSize param, and JSON response shape.

jest.mock('@/lib/data/BlogData', () => {
    const MOCK = Array.from({ length: 25 }, (_, i) => ({
        entryId: String(i + 1),
        title: `Post ${i + 1}`,
    }));
    return {
        __esModule: true,
        default: { getInstance: () => ({ getEntries: (page, size) => MOCK.slice(page * size, (page + 1) * size) }) },
    };
});

import { GET } from '@/app/api/entries/latest/[page]/route';

test('returns entries for page 0', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/0?pageSize=10'), { params: { page: '0' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(10);
    expect(data[0].entryId).toBe('1');
});

test('returns entries for page 1', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/1?pageSize=10'), { params: { page: '1' } });
    const data = await res.json();
    expect(data).toHaveLength(10);
    expect(data[0].entryId).toBe('11');
});

test('returns empty array past last page', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/99?pageSize=10'), { params: { page: '99' } });
    expect(await res.json()).toHaveLength(0);
});

test('defaults pageSize to 10', async () => {
    const res = await GET(new Request('http://x/api/entries/latest/0'), { params: { page: '0' } });
    expect(await res.json()).toHaveLength(10);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/app/api/entries/latest.test.js
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the route**

Create `app/api/entries/latest/[page]/route.js`:

```javascript
// ABOUTME: GET /api/entries/latest/[page] — returns one page of blog entries.
// ABOUTME: Query param: pageSize (default 10). Page number is zero-indexed.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const page = parseInt(params.page, 10) || 0;
    const pageSize = parseInt(new URL(request.url).searchParams.get('pageSize'), 10) || 10;
    return NextResponse.json(BlogData.getInstance().getEntries(page, pageSize));
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/app/api/entries/latest.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/api/entries/latest/[page]/route.js" __tests__/app/api/entries/latest.test.js
git commit -m "feat(nodb): add GET /api/entries/latest/[page] route"
```

---

### Task 4: API route — single entry by ID

**Files:**
- Create: `app/api/entries/[id]/route.js`
- Create: `__tests__/app/api/entries/entry.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/app/api/entries/entry.test.js`:

```javascript
// ABOUTME: Tests for GET /api/entries/[id] — fetch a single blog entry.
// ABOUTME: Verifies found, not-found, and response format.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getPostById: jest.fn(id =>
                id === '42'
                    ? { entryId: '42', title: 'Found Post' }
                    : null
            ),
        }),
    },
}));

import { GET } from '@/app/api/entries/[id]/route';

test('returns post when found', async () => {
    const res = await GET(new Request('http://x/api/entries/42'), { params: { id: '42' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entryId).toBe('42');
    expect(data.title).toBe('Found Post');
});

test('returns 404 when not found', async () => {
    const res = await GET(new Request('http://x/api/entries/999'), { params: { id: '999' } });
    expect(res.status).toBe(404);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/app/api/entries/entry.test.js
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the route**

Create `app/api/entries/[id]/route.js`:

```javascript
// ABOUTME: GET /api/entries/[id] — returns a single blog entry by entryId.
// ABOUTME: Returns 404 if the entry does not exist.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const post = BlogData.getInstance().getPostById(params.id);
    if (!post) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(post);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/app/api/entries/entry.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/api/entries/[id]/route.js" __tests__/app/api/entries/entry.test.js
git commit -m "feat(nodb): add GET /api/entries/[id] route"
```

---

### Task 5: API route — next post navigation

**Files:**
- Create: `app/api/entries/[id]/next/route.js`
- Create: `__tests__/app/api/entries/next.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/app/api/entries/next.test.js`:

```javascript
// ABOUTME: Tests for GET /api/entries/[id]/next — navigate to the newer post.
// ABOUTME: Verifies found, end-of-archive (null), and response format.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getNextPost: jest.fn(id => {
                if (id === '5') return { entryId: '6', title: 'Newer Post' };
                return null;
            }),
        }),
    },
}));

import { GET } from '@/app/api/entries/[id]/next/route';

test('returns the next (newer) post', async () => {
    const res = await GET(new Request('http://x/api/entries/5/next'), { params: { id: '5' } });
    expect(res.status).toBe(200);
    expect((await res.json()).entryId).toBe('6');
});

test('returns 404 when there is no next post', async () => {
    const res = await GET(new Request('http://x/api/entries/99/next'), { params: { id: '99' } });
    expect(res.status).toBe(404);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/app/api/entries/next.test.js
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the route**

Create `app/api/entries/[id]/next/route.js`:

```javascript
// ABOUTME: GET /api/entries/[id]/next — returns the next (chronologically newer) blog entry.
// ABOUTME: Returns 404 if the given post is already the newest.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const next = BlogData.getInstance().getNextPost(params.id);
    if (!next) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(next);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/app/api/entries/next.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/api/entries/[id]/next/route.js" __tests__/app/api/entries/next.test.js
git commit -m "feat(nodb): add GET /api/entries/[id]/next route"
```

---

### Task 6: API route — prev post navigation

**Files:**
- Create: `app/api/entries/[id]/prev/route.js`
- Create: `__tests__/app/api/entries/prev.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/app/api/entries/prev.test.js`:

```javascript
// ABOUTME: Tests for GET /api/entries/[id]/prev — navigate to the older post.
// ABOUTME: Verifies found, end-of-archive (null), and response format.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getPrevPost: jest.fn(id => {
                if (id === '5') return { entryId: '4', title: 'Older Post' };
                return null;
            }),
        }),
    },
}));

import { GET } from '@/app/api/entries/[id]/prev/route';

test('returns the prev (older) post', async () => {
    const res = await GET(new Request('http://x/api/entries/5/prev'), { params: { id: '5' } });
    expect(res.status).toBe(200);
    expect((await res.json()).entryId).toBe('4');
});

test('returns 404 when there is no prev post', async () => {
    const res = await GET(new Request('http://x/api/entries/1/prev'), { params: { id: '1' } });
    expect(res.status).toBe(404);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/app/api/entries/prev.test.js
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the route**

Create `app/api/entries/[id]/prev/route.js`:

```javascript
// ABOUTME: GET /api/entries/[id]/prev — returns the prev (chronologically older) blog entry.
// ABOUTME: Returns 404 if the given post is already the oldest.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const prev = BlogData.getInstance().getPrevPost(params.id);
    if (!prev) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json(prev);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/app/api/entries/prev.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/api/entries/[id]/prev/route.js" __tests__/app/api/entries/prev.test.js
git commit -m "feat(nodb): add GET /api/entries/[id]/prev route"
```

---

### Task 7: API route — search stubs

**Files:**
- Create: `app/api/entries/search/[numEntries]/route.js`
- Create: `__tests__/app/api/entries/search.test.js`

- [ ] **Step 1: Write the failing test**

Create `__tests__/app/api/entries/search.test.js`:

```javascript
// ABOUTME: Tests for GET /api/entries/search/[numEntries] — bulk stubs for client-side search.
// ABOUTME: Verifies count limiting and response format.

jest.mock('@/lib/data/BlogData', () => {
    const STUBS = Array.from({ length: 50 }, (_, i) => ({ entryId: String(i + 1), title: `Post ${i + 1}` }));
    return {
        __esModule: true,
        default: { getInstance: () => ({ getSearchStubs: n => STUBS.slice(0, n) }) },
    };
});

import { GET } from '@/app/api/entries/search/[numEntries]/route';

test('returns the requested number of entries', async () => {
    const res = await GET(
        new Request('http://x/api/entries/search/10'),
        { params: { numEntries: '10' } }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(10);
});

test('returns all available when numEntries exceeds total', async () => {
    const res = await GET(
        new Request('http://x/api/entries/search/1000'),
        { params: { numEntries: '1000' } }
    );
    expect(await res.json()).toHaveLength(50);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/app/api/entries/search.test.js
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the route**

Create `app/api/entries/search/[numEntries]/route.js`:

```javascript
// ABOUTME: GET /api/entries/search/[numEntries] — returns up to numEntries post stubs.
// ABOUTME: Used by the client-side search feature to build a local search index.

import { NextResponse } from 'next/server';
import BlogData from '@/lib/data/BlogData';

export function GET(request, { params }) {
    const numEntries = parseInt(params.numEntries, 10) || 1000;
    return NextResponse.json(BlogData.getInstance().getSearchStubs(numEntries));
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/app/api/entries/search.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/api/entries/search/[numEntries]/route.js" __tests__/app/api/entries/search.test.js
git commit -m "feat(nodb): add GET /api/entries/search/[numEntries] route"
```

---

### Task 8: Update RSS route and environment config

**Files:**
- Modify: `app/rss/route.js`
- Modify: `.env.local`

The RSS route currently calls `PostDao.getPostDao()` (which we're about to remove). Since RSS is server-side, it can call `BlogData` directly. The env var change makes client-side `PostDao` calls route to the new local API.

- [ ] **Step 1: Write a failing test for the RSS route using BlogData**

No existing test for this route exists. Create `__tests__/app/api/rss.test.js`:

```javascript
// ABOUTME: Tests for the RSS feed route.
// ABOUTME: Verifies that the feed uses BlogData and produces valid RSS XML.

jest.mock('@/lib/data/BlogData', () => ({
    __esModule: true,
    default: {
        getInstance: () => ({
            getEntries: jest.fn(() => [
                {
                    entryId: '1',
                    title: 'Test Post',
                    intro: 'Test intro',
                    datePosted: '2023-01-01T00:00:00',
                },
            ]),
        }),
    },
}));

jest.mock('@/lib/util/Links', () => ({
    getPostLink: jest.fn(() => 'https://raser.io/archive/1'),
}));

import { GET } from '@/app/rss/route';

test('returns RSS XML with Content-Type header', async () => {
    const res = await GET(new Request('http://x/rss'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/rss+xml');
});

test('RSS body contains post title and link', async () => {
    const res = await GET(new Request('http://x/rss'));
    const text = await res.text();
    expect(text).toContain('<title><![CDATA[Test Post]]></title>');
    expect(text).toContain('https://raser.io/archive/1');
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- rss.test.js
```

Expected: FAIL (route still uses PostDao, not BlogData mock)

- [ ] **Step 3: Update app/rss/route.js**

Replace the current `renderPosts()` function. The file currently reads:

```javascript
import { NextResponse, NextRequest } from "next/server";
import PostDao from "@/model/PostDao";
import { getPostLink } from "@/lib/util/Links";
```

Change to use BlogData directly:

```javascript
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- rss.test.js
```

Expected: PASS

- [ ] **Step 5: Update .env.local**

In `.env.local`, change:
```
NEXT_PUBLIC_API_ROOT="https://damp-island-38652-5044b8af1a09.herokuapp.com"
```
to:
```
NEXT_PUBLIC_API_ROOT="/api"
```

- [ ] **Step 6: Update Vercel environment variable**

In the Vercel dashboard (or via CLI), update `NEXT_PUBLIC_API_ROOT` to `/api` for all environments (Development, Preview, Production).

```bash
# Or via CLI if available:
vercel env rm NEXT_PUBLIC_API_ROOT production
vercel env add NEXT_PUBLIC_API_ROOT production
# Enter: /api
```

- [ ] **Step 7: Commit**

```bash
git add app/rss/route.js __tests__/app/api/rss.test.js .env.local
git commit -m "feat(nodb): update RSS route to use BlogData; switch API root to /api"
```

---

### Task 9: Update getStaticProps pages to use BlogData

**Files:**
- Modify: `pages/index.js`
- Modify: `pages/archive/index.jsx`
- Modify: `pages/archive/[postId].jsx`

`getStaticProps` and `getStaticPaths` run at build time when no HTTP server is available, so they must call `BlogData` directly instead of going through `PostDao`.

- [ ] **Step 1: Update pages/index.js**

The `getStaticProps` currently creates a `PostDao` and calls `getEntries()`. Replace with `BlogData`:

```javascript
// In pages/index.js, replace the getStaticProps function:

export async function getStaticProps() {
    try {
        const config = new SiteConfig();
        const entriesCount = config.getValue('staticGeneration.prerender.archiveEntries') || 30;
        const recentPostsCount = 6;
        const revalidateSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds') || 3600;
        const isLandingPageEnabled = config.featureFlags?.showLandingFrontpage ?? true;

        const entries = BlogData.getInstance().getEntries(0, entriesCount);
        const recentPosts = entries.slice(1, recentPostsCount);
        const latestPost = entries[0];

        return {
            props: { latestPost, recentPosts, entries, isLandingPageEnabled },
            revalidate: revalidateSeconds
        };
    } catch (error) {
        console.error('Error fetching initial data:', error);
        return {
            props: { latestPost: null, recentPosts: [], entries: [], isLandingPageEnabled: true }
        };
    }
}
```

Also update the imports at the top of `pages/index.js` — replace the `PostDao` import with `BlogData`:

```javascript
// Remove:
import PostDao from '@/model/PostDao';

// Add:
import BlogData from '@/lib/data/BlogData';
```

- [ ] **Step 2: Update pages/archive/index.jsx**

In `pages/archive/index.jsx`, replace `getStaticProps`:

```javascript
// Remove:
import PostDao from '@/model/PostDao';

// Add:
import BlogData from '@/lib/data/BlogData';
```

```javascript
export async function getStaticProps() {
    try {
        const config = new SiteConfig();
        const entriesCount = config.getValue('staticGeneration.prerender.archiveEntries') || 30;
        const revalidateSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds') || 3600;
        const initialEntries = BlogData.getInstance().getEntries(0, entriesCount);
        return {
            props: { initialEntries },
            revalidate: revalidateSeconds
        };
    } catch (error) {
        console.error('Error fetching initial entries:', error);
        return { props: { initialEntries: [] } };
    }
}
```

- [ ] **Step 3: Update pages/archive/[postId].jsx**

In `pages/archive/[postId].jsx`, replace `getStaticPaths` and `getStaticProps`:

```javascript
// Remove:
import PostDao from '@/model/PostDao';

// Add:
import BlogData from '@/lib/data/BlogData';
```

```javascript
export async function getStaticPaths() {
    const config = new SiteConfig();
    const postsToPrerender = config.getValue('staticGeneration.prerender.posts') || 20;
    const recentPosts = BlogData.getInstance().getEntries(0, postsToPrerender);
    const paths = recentPosts.map(post => ({
        params: { postId: String(post.entryId) }
    }));
    return { paths, fallback: true };
}

export async function getStaticProps({ params }) {
    try {
        const config = new SiteConfig();
        const revalidateSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds') || 3600;
        return { props: {}, revalidate: revalidateSeconds };
    } catch (error) {
        console.error(`Error fetching post ${params.postId}:`, error);
        return { notFound: true };
    }
}
```

- [ ] **Step 4: Run full test suite to verify nothing broke**

```bash
npm test
```

Expected: all existing tests pass

- [ ] **Step 5: Commit**

```bash
git add pages/index.js pages/archive/index.jsx "pages/archive/[postId].jsx"
git commit -m "feat(nodb): update getStaticProps pages to use BlogData directly"
```

---

### Task 10: Remove write methods from PostDao

**Files:**
- Modify: `model/PostDao.js`
- Create: `__tests__/model/PostDao.test.js`

Remove `createPost`, `publishPost`, `updatePost`, `deletePost`, `#sendPost`, `#auth`, `getEdgePostDao`, and `getPostDao` from `PostDao`. Also remove the `EdgeConfigPostDao` import.

- [ ] **Step 1: Write failing tests**

Create `__tests__/model/PostDao.test.js`:

```javascript
// ABOUTME: Tests for PostDao — verifies read-only interface after write method removal.
// ABOUTME: Confirms write methods and dead factory methods no longer exist.

import PostDao from '@/model/PostDao';

describe('PostDao read methods', () => {
    test('getCachingPostDao() returns an object with read methods', () => {
        const dao = PostDao.getCachingPostDao();
        expect(typeof dao.getLatestPost).toBe('function');
        expect(typeof dao.getPostById).toBe('function');
        expect(typeof dao.getNextPost).toBe('function');
        expect(typeof dao.getPrevPost).toBe('function');
        expect(typeof dao.getEntries).toBe('function');
        expect(typeof dao.getSearchStubs).toBe('function');
    });
});

describe('PostDao write methods are removed', () => {
    test('createPost does not exist on PostDao instance', () => {
        expect(new PostDao().createPost).toBeUndefined();
    });

    test('publishPost does not exist on PostDao instance', () => {
        expect(new PostDao().publishPost).toBeUndefined();
    });

    test('updatePost does not exist on PostDao instance', () => {
        expect(new PostDao().updatePost).toBeUndefined();
    });

    test('deletePost does not exist on PostDao instance', () => {
        expect(new PostDao().deletePost).toBeUndefined();
    });
});

describe('PostDao dead factory methods are removed', () => {
    test('getPostDao static method does not exist', () => {
        expect(PostDao.getPostDao).toBeUndefined();
    });

    test('getEdgePostDao static method does not exist', () => {
        expect(PostDao.getEdgePostDao).toBeUndefined();
    });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- __tests__/model/PostDao.test.js
```

Expected: FAIL — the write methods and factory methods currently exist

- [ ] **Step 3: Remove write methods from PostDao**

Edit `model/PostDao.js`. The final file should be:

```javascript
// ABOUTME: DAO for blog entries — fetches data from the local Next.js API routes.
// ABOUTME: All read operations; write operations are not supported (use file-based authoring).

import SiteConfig from "@/lib/SiteConfig";
import CachingPostDao from "@/model/CachingPostDao";
import { formatUrl } from "@/lib/util/StringFormatter";

export default class PostDao {
    #config = new SiteConfig();

    static getCachingPostDao() {
        return new CachingPostDao(new PostDao());
    }

    #api(path, params) {
        let template = `${this.#config.api.root}${path}`;
        return formatUrl(template, params);
    }

    #cleanFetch(...args) {
        return fetch(...args)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response;
            })
            .catch(e => {
                console.error({ e, arguments });
            });
    }

    async getLatestPost() {
        const page = 0;
        const pageSize = 1;
        let url = this.#config.getEndpoint('entries.latest', { page, pageSize });
        return this.#cleanFetch(url)
            .then(response => response.json())
            .then(p => p[0]);
    }

    async getPostById(id) {
        id = encodeURIComponent(id);
        let url = this.#config.getEndpoint('entries.entry', { id });
        return this.#cleanFetch(url).then(response => response.json());
    }

    async getNextPost(p) {
        let id = encodeURIComponent(p.entryId || p);
        let url = this.#config.getEndpoint('entries.next', { id });
        return this.#cleanFetch(url)
            .then(response => response.json())
            .catch(() => null);
    }

    async getPrevPost(p) {
        let id = encodeURIComponent(p.entryId || p);
        let url = this.#config.getEndpoint('entries.previous', { id });
        return this.#cleanFetch(url)
            .then(response => response.json())
            .catch(() => null);
    }

    async getEntries(page = 0, pageSize = 10) {
        let url = this.#config.getEndpoint('entries.latest', { page, pageSize });
        return this.#cleanFetch(url).then(response => response.json());
    }

    async getSearchStubs(numEntries = 1000) {
        let url = this.#config.getEndpoint('entries.bulk', { numEntries });
        return this.#cleanFetch(url).then(response => response.json());
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/model/PostDao.test.js
```

Expected: PASS

- [ ] **Step 5: Delete EdgeConfigPostDao.js**

```bash
rm model/EdgeConfigPostDao.js
git rm model/EdgeConfigPostDao.js
```

- [ ] **Step 6: Run full test suite to confirm nothing else broke**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add model/PostDao.js __tests__/model/PostDao.test.js
git commit -m "feat(nodb): remove write methods and dead factory methods from PostDao; delete EdgeConfigPostDao"
```

---

### Task 11: Remove write proxies from CachingPostDao

**Files:**
- Modify: `model/CachingPostDao.js`
- Modify: `__tests__/model/CachingPostDao.test.js`

- [ ] **Step 1: Write failing tests**

Add to `__tests__/model/CachingPostDao.test.js` (append after existing tests):

```javascript
// Verify write methods are not present on CachingPostDao

describe('CachingPostDao write methods are removed', () => {
    const mockDao = {
        getLatestPost: jest.fn(),
        getPostById: jest.fn(),
        getNextPost: jest.fn(),
        getPrevPost: jest.fn(),
        getEntries: jest.fn(),
        getSearchStubs: jest.fn(),
    };

    test('createPost does not exist', () => {
        expect(new CachingPostDao(mockDao).createPost).toBeUndefined();
    });

    test('publishPost does not exist', () => {
        expect(new CachingPostDao(mockDao).publishPost).toBeUndefined();
    });

    test('updatePost does not exist', () => {
        expect(new CachingPostDao(mockDao).updatePost).toBeUndefined();
    });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- CachingPostDao.test.js
```

Expected: FAIL — the write methods exist

- [ ] **Step 3: Remove write proxies from CachingPostDao**

Edit `model/CachingPostDao.js`. Remove the `createPost`, `publishPost`, and `updatePost` methods. The final file should be:

```javascript
// ABOUTME: Decorator around PostDao that caches post lookups in an LRU cache.
// ABOUTME: Caches individual posts by entryId and tracks next/prev relationships.

import LruCache from '@/lib/cache/LruCache';

export default class CachingPostDao {
    #dao = null;
    #cache;

    constructor(dao) {
        this.#dao = dao;
        this.#cache = new LruCache(100);
    }

    #hit(id) {
        console.debug(`Cache HIT for ${id}`);
    }

    #miss(id) {
        console.debug(`Cache MISS for ${id}`);
    }

    async getLatestPost() {
        let post = await this.#dao.getLatestPost();
        this.#cache.put(post.entryId, post);
        return post;
    }

    async getPostById(id) {
        let post = this.#cache.get(id);
        if (!post) {
            this.#miss(id);
            post = await this.#dao.getPostById(id);
            this.#cache.put(post.entryId, post);
        } else {
            this.#hit(id);
        }
        return post;
    }

    async getNextPost(prev) {
        let meta = this.#cache.getMeta(prev.entryId);
        console.log({ prev, meta });
        if (meta.next) {
            return await this.getPostById(meta.next);
        } else {
            let next = await this.#dao.getNextPost(prev);
            if (next) {
                this.#cache.put(next.entryId, next);
                this.#cache.setMeta(next.entryId, { prev: prev.entryId });
                this.#cache.setMeta(prev.entryId, { next: next.entryId });
            }
            return next;
        }
    }

    async getPrevPost(next) {
        let meta = this.#cache.getMeta(next.entryId);
        if (meta.prev) {
            return await this.getPostById(meta.prev);
        } else {
            let prev = await this.#dao.getPrevPost(next);
            if (prev) {
                this.#cache.put(prev.entryId, prev);
                this.#cache.setMeta(next.entryId, { prev: prev.entryId });
                this.#cache.setMeta(prev.entryId, { next: next.entryId });
            }
            return prev;
        }
    }

    async getEntries(...args) {
        let posts = await this.#dao.getEntries(...args);
        posts.forEach((p, i) => {
            this.#cache.put(p.entryId, p);
            if (posts[i + 1]) {
                let prev = posts[i + 1]; // previous in TIME, presented in reverse-chronological order
                this.#cache.setMeta(p.entryId, { prev: prev.entryId });
                this.#cache.setMeta(prev.entryId, { next: p.entryId });
            }
        });
        return posts;
    }

    async getSearchStubs(numEntries = 1000) {
        return this.#dao.getSearchStubs(numEntries);
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- CachingPostDao.test.js
```

Expected: PASS (all original tests + new removal tests)

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add model/CachingPostDao.js __tests__/model/CachingPostDao.test.js
git commit -m "feat(nodb): remove write method proxies from CachingPostDao"
```

---

### Task 12: Remove dead admin components and pages

Chris has explicitly approved this removal. These files only exist to support the write operations that were removed in Tasks 10–11.

**Files to delete:**
- `components/EditPostView.jsx`
- `components/pages/EditPostPage.jsx`
- `components/pages/CreatePostPage.jsx`
- `components/DeleteLink.jsx`
- `pages/edit/[postId].js`
- `pages/create/index.jsx`
- Any test files that exist only for these components (check `__tests__/components/` for matches)

- [ ] **Step 1: Check for test files covering deleted components**

```bash
ls __tests__/components/ | grep -iE "edit|create|delete"
ls __tests__/features/ | grep -iE "edit|create|delete"
```

Delete any test files found that exclusively test the components being removed.

- [ ] **Step 2: Delete the dead files**

```bash
git rm components/EditPostView.jsx \
       components/pages/EditPostPage.jsx \
       components/pages/CreatePostPage.jsx \
       components/DeleteLink.jsx \
       "pages/edit/[postId].js" \
       pages/create/index.jsx
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass (no test should be importing deleted files)

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(nodb): delete admin write components and pages (write ops removed)"
```

---

### Task 13: Clean up siteconfig.json

**Files:**
- Modify: `siteconfig.json`

Remove endpoint config for operations that no longer exist.

- [ ] **Step 1: Remove write and auth endpoint config**

In `siteconfig.json`, update the `api.endpoints` section. Remove `auth` entirely, and remove `create`, `delete`, `publish`, `update` from `entries`. The final `api` section should be:

```json
"api": {
    "root": "{NEXT_PUBLIC_API_ROOT}",
    "endpoints": {
        "entries": {
            "entry": "/entries/{id}",
            "latest": "/entries/latest/{page}?pageSize={pageSize}",
            "next": "/entries/{id}/next",
            "previous": "/entries/{id}/prev",
            "bulk": "/entries/search/{numEntries}"
        },
        "maps": {
            "mapimageuri": "/attachments/maps/mapimageuri/{fileName}"
        }
    }
}
```

- [ ] **Step 2: Verify SiteConfig tests still pass**

```bash
npm test -- SiteConfig.test.js
```

Expected: PASS

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add siteconfig.json
git commit -m "feat(nodb): remove write and auth endpoint config from siteconfig.json"
```

---

### Task 14: End-to-end verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the homepage loads**

Open `http://localhost:3000` — the landing page should load and display the latest post. No console errors about failed fetches.

- [ ] **Step 3: Verify the archive loads and paginates**

Open `http://localhost:3000/archive` — the first 30 entries should appear. Scroll to the bottom — the next page should load via infinite scroll. Check the network tab and confirm requests go to `/api/entries/latest/1?pageSize=30`.

- [ ] **Step 4: Verify individual post pages**

Open a post from the archive (e.g., `/archive/3420`) — the post content should display. The next/prev links should work and navigate to adjacent posts.

- [ ] **Step 5: Verify RSS feed**

Open `http://localhost:3000/rss` — should return valid RSS XML containing the 20 most recent posts.

- [ ] **Step 6: Run the full test suite one final time**

```bash
npm test
```

Expected: all tests pass, no skipped tests, pristine output (no unexpected console errors/warnings).

- [ ] **Step 7: Commit any remaining changes and push**

```bash
git status  # should be clean
git push origin nodb
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| No database at deploy time | Tasks 1–3: data in committed JSON files |
| Add entries by adding files | `data/posts.json` is the source of truth; add a record, redeploy |
| Keep DAO architecture intact | `PostDao` + `CachingPostDao` unchanged except for write removal |
| Remove write operations from DAOs | Tasks 10–11 |
| Preserve links data | `data/links.json` exported in Task 1 |
| No dead code | Tasks 10–12 remove all write-dependent dead code |

**Open items (not in scope for this plan):**
- Vercel dashboard `NEXT_PUBLIC_API_ROOT` update (noted in Task 8, Step 6; must be done manually)
- Links page feature (links data is preserved; page to be built later)
- `EDGE_CONFIG` env var (no longer needed for blog data; can be removed when EdgeConfig is fully decommissioned)
