# Blog Post Publisher — Design

Date: 2026-10-03

## Goal

Replace the retired web form with a local command-line tool that publishes a blog post from a
folder on disk: it uploads the post's images and documents to the Bunny CDN and writes the post
to the production CockroachDB database. Re-running it on the same folder updates the post.

## Constraints

- **Separate credentials.** The tool must not read the app's `.env` files or the app's variable
  names (`DATABASE_URL`, `BUNNY_*`). It gets its own credentials, from 1Password, via `op run`.
- **Least privilege.** The tool connects as a dedicated `blog_publisher` database role that can
  only touch the tables publishing needs.
- **Production by default.** There is no local-database target. `--dry-run` is the safety net.
- **Flat CDN layout.** Uploads go to the root of the storage zone, as all existing files do, and
  must never silently overwrite another post's file.

## Context

- The database is CockroachDB (production on CockroachDB Cloud). `blog_entries.entry_id`,
  `attachments.attachment_id` and `tags.tag_id` are plain `INT4` primary keys with no default or
  sequence, so the tool assigns them.
- Title images render from `https://raserio.b-cdn.net/{imageFileName}`
  (`siteconfig.json` → `images.postcard`). `image_file_type` is `1` for an image and `0` for a
  map; `PostTitleImage` renders any `.gpx` file name as a map.
- Recent posts store `allow_comments = 'false'`, `syndicate = 'false'`, `user_id = 1`,
  `user_name = 'Chris'`.
- The site regenerates pages at most hourly (`staticGeneration.prerender.revalidateSeconds`).

## Command line

Exposed as `npm run blog-post`. The entry point source is `scripts/blog-post.js`; `npm run build:publish`
bundles it and `lib/publish/` with esbuild into `bin/blog-post.mjs` (gitignored), which is what runs.
`npm run blog-post` rebuilds first, via a `preblog-post` script. Because of the build step, the sources
use the `@/` alias like the rest of the codebase and contain nothing specific to how they are run.

```
npm run blog-post -- --gen <name>
npm run blog-post -- <post-dir> [--dry-run] [--force] [--yes]
```

- `--gen <name>` creates `posts/<name>/` from the template (see below). It needs no credentials.
  It refuses to run if the folder already exists. `posts/` is gitignored.
- `<post-dir>` publishes the folder to production.
- `--dry-run` runs validation and every read-only step, prints the plan, and changes nothing.
- `--force` allows uploads to overwrite colliding CDN files.
- `--yes` skips the confirmation prompt.

Before a real publish, the tool prints a summary and asks for confirmation, for example:
`Publish "My Trip" (new entry) with 6 files to raser.io? [y/N]`.

### Credential loading

The CLI checks for the `PUBLISH_*` variables. If any are missing during a publish
or dry run, it re-launches itself as
`op run --env-file=scripts/publish/publish.env -- node bin/blog-post.mjs <same args>`.
`--gen` never triggers the re-launch. If `op` is not installed or sign-in fails, the tool prints a
short explanation instead of a stack trace.

`scripts/publish/publish.env` is committed and holds only 1Password references:

```
PUBLISH_DATABASE_URL=op://5zneo7hc5c6n7j6y6vgzivadvq/raser.io publisher/database_url
PUBLISH_BUNNY_STORAGE_HOST=op://5zneo7hc5c6n7j6y6vgzivadvq/raser.io publisher/bunny_storage_host
PUBLISH_BUNNY_STORAGE_ZONE=op://5zneo7hc5c6n7j6y6vgzivadvq/raser.io publisher/bunny_storage_zone
PUBLISH_BUNNY_ACCESS_KEY=op://5zneo7hc5c6n7j6y6vgzivadvq/raser.io publisher/bunny_access_key
```

The vault is referenced by ID because two 1Password vaults are named "raser.io".

### Database role

`scripts/publish/create-publisher-role.sql` is a one-time script that Chris runs in the CockroachDB
Cloud console. It creates `blog_publisher` (password supplied at run time, stored in 1Password)
with exactly these grants:

| Table          | Privileges             |
|----------------|------------------------|
| `blog_entries` | SELECT, INSERT, UPDATE |
| `attachments`  | SELECT, INSERT, DELETE |
| `tags`         | SELECT, INSERT         |
| `tag_links`    | SELECT, INSERT, DELETE |

No access to `users`, `auth_token`, `comments`, `links` or `attachment_bytes`.

## Post folder

```
posts/<name>/
  post.json
  intro.html
  body.html
  images/
  docs/
```

`--gen` writes `intro.html` and `body.html` as short placeholder paragraphs, and empty `images/`
and `docs/` directories.

### `post.json`

Template written by `--gen`:

```json
{
  "title": "",
  "datePosted": null,
  "titleImage": null,
  "via": { "url": null, "title": null, "text": null },
  "tags": [],
  "attachments": [],
  "_attachmentExample": {
    "path": "images/hero.jpg",
    "title": "Halls Lake",
    "description": "Optional longer description",
    "gallery": false
  },
  "entryId": null
}
```

| Field         | Meaning |
|---------------|---------|
| `title`       | Required, non-empty. → `title` |
| `datePosted`  | `"YYYY-MM-DD HH:MM"` in local time, or `null`. `null` means "now" on first publish; the tool writes the value back so re-runs keep it. → `date_posted` |
| `titleImage`  | Folder-relative path of a file in the folder, or `null`. → `image_file_name` (the file's basename) and `image_file_type` (`0` for `.gpx`, otherwise `1`) |
| `via`         | Optional; each of `url`, `title`, `text` may be `null`. → `via_url`, `via_title`, `via_text` |
| `tags`        | Array of tag names. |
| `attachments` | Array of optional per-file metadata: `{ path, title?, description?, gallery? }`. |
| `entryId`     | Written by the tool after the first publish. Not edited by hand. |

Any top-level key starting with `_` is ignored, so `_attachmentExample` can stay as a reminder of
the format.

Fixed values, not in `post.json`: `user_id = 1`, `user_name = 'Chris'`,
`allow_comments = 'false'`, `syndicate = 'false'`.

### Files

- Every file under `images/` and `docs/` is uploaded and gets an `attachments` row, whether or not
  it is listed in `attachments`.
- `file_type`: `'map'` for `.gpx` files, otherwise `'image'` under `images/` and `'document'`
  under `docs/`.
- `mime_type` comes from the file extension.
- `title` and `description` come from the matching `attachments` entry. Without one, `title` is
  the file's basename and `description` is null. `is_gallery_image` is `'true'` or `'false'`
  from `gallery` (default `'false'`). `date_posted` matches the post's.
- Each file uploads to the zone root under its basename. `file_name` stores that basename.

### HTML link rewriting

When building the `intro` and `body` column values, the tool rewrites every `src="…"` or
`href="…"` attribute (either quote style) whose value is the folder-relative path of a file in the
folder, replacing it with `https://raserio.b-cdn.net/<basename>`. All other values, including
absolute URLs and `archive/…` links, are left untouched. The `.html` files on disk are never
modified, so they still preview locally.

## Validation

All of these checks run locally, before any network call, and every failure is reported in one
pass:

- `post.json` parses, and `title` is non-empty.
- `datePosted` is `null` or matches `YYYY-MM-DD HH:MM`.
- `intro.html` exists. `body.html` may be empty.
- `titleImage`, if set, is a file in the folder.
- Every `attachments` entry has a `path` naming a file in `images/` or `docs/`, and no `path`
  appears twice.
- No two files in `images/` and `docs/` share a basename.
- Every `src` or `href` value beginning with `images/` or `docs/` names a file in the folder.

## Publish sequence

1. **Validate** (above).
2. **Plan.**
   - If `entryId` is set, load that entry and its attachment file names. A missing entry is an
     error; the tool never silently creates a duplicate.
   - List the storage zone root once, giving each existing file's name and SHA-256 checksum.
     (Bunny's storage listing reports a `Checksum` per object; confirm this against the live API
     before relying on it.)
   - Classify each local file:

     | CDN state                                                   | Action    |
     |-------------------------------------------------------------|-----------|
     | Absent                                                      | Upload    |
     | Present, same checksum                                      | Skip      |
     | Present, different checksum, one of this entry's attachments | Upload    |
     | Present, different checksum, not this entry's               | Collision |

   - If there are collisions and no `--force`, list them all and stop. With `--force`, they become
     uploads.
3. **Show the plan** (new or update, uploads, skips, collisions) and ask for confirmation unless
   `--yes`. `--dry-run` stops here.
4. **Upload** the files marked Upload.
5. **Write the database** in one transaction:
   - New post: `entry_id = MAX(entry_id) + 1`; `INSERT` into `blog_entries`.
   - Existing post: `UPDATE` title, intro, body, image fields, via fields and `last_updated`.
   - `last_updated` is set to now; `date_posted` comes from `datePosted`.
   - Attachments: `DELETE` this entry's rows, then `INSERT` one row per file with
     `attachment_id = MAX(attachment_id) + 1, + 2, …`.
   - Tags: `INSERT` names missing from `tags` (`tag_id = MAX + 1, …`), then replace this entry's
     `tag_links`.
   - On SQLSTATE `40001` (a CockroachDB transaction retry error), roll back and retry the whole
     transaction, up to 3 attempts.
6. **Write back** `entryId` and `datePosted` to `post.json`, keeping the other content and key
   order.

Files removed from the folder lose their `attachments` row on the next publish. The tool never
deletes anything from the CDN.

## Error handling

| Failure | Result |
|---------|--------|
| Upload fails partway | Stop before touching the database. Files that did upload match by checksum and are skipped next run. |
| Database transaction fails | Nothing is committed. Uploaded files are inert and skipped next run. |
| `post.json` write-back fails after commit | Print the new `entryId` and say to add it to `post.json` by hand, so the next run updates instead of duplicating. |
| `op` missing or sign-in fails | Short explanation, no stack trace. |

## Components

All under `lib/publish/` unless noted. Imports use the `@/` alias, resolved by esbuild when
bundling and by Jest in tests.

| Unit | Responsibility |
|------|----------------|
| `scripts/blog-post.js` | Argument parsing, `op run` re-launch, confirmation prompt, output. |
| `PostScaffold` | `--gen`: creates the folder and template files. |
| `PostFolder` | Reads and validates a folder; reads and writes `post.json`. |
| `LinkRewriter` | Rewrites folder-relative `src`/`href` values to CDN URLs. |
| `CdnStore` | Bunny storage zone: list the root with checksums, upload a file. Configured from `PUBLISH_BUNNY_*`. |
| `PublishPlanner` | Produces the plan: new or update, each file's action, collisions. |
| `PostWriter` | The database transaction, including ID assignment and retry. Configured from `PUBLISH_DATABASE_URL`. |
| `Publisher` | Runs validate → plan → (confirm) → upload → write → write-back. |

Also: `esbuild` as a devDependency; `build:publish`, `preblog-post` and `blog-post` scripts in
`package.json`; `posts/` and `bin/` in `.gitignore`; and
`scripts/publish/publish.env` plus `scripts/publish/create-publisher-role.sql`.

## Testing

Jest unit tests for each unit, written test-first, using in-memory fakes for the CDN and the
database query interface:

- `PostScaffold`: creates the expected files in a temp directory; refuses an existing folder.
- `PostFolder`: each validation rule; ignores `_` keys; write-back keeps other content.
- `LinkRewriter`: rewrites folder files, leaves other values alone, handles both quote styles.
- `PublishPlanner`: each row of the classification table, `--force`, and a missing `entryId` row.
- `PostWriter`: insert vs update SQL, attachment and tag replacement, ID assignment, retry on
  `40001` and no retry on other errors.
- `scripts/blog-post.js`: argument parsing and the re-launch decision.

There is no integration test against a real database; the local CockroachDB setup lives on the
unmerged `dev-db` branch. The first live check is `--dry-run` against production, which is
read-only.

## Out of scope

- Deleting posts, and cleaning up orphaned CDN files.
- Triggering site revalidation; a new post can take up to an hour to appear.
- A local-database target.
- Publishing from CI (a possible follow-up; the tool already reads only environment variables).
