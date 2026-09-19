# Removing Front-End Authentication

**Date:** 2026-09-18
**Branch:** `removing-auth`

## Goal

The site becomes read-only from the front end. No visitor can log in, and no
component renders a control that writes. Server-side write operations that
happen as a side effect of rendering — pushing map images to the CDN, for
example — are out of scope and stay exactly as they are.

## What Drives This

Authoring moves elsewhere. The front end keeps only what every visitor sees,
so the authentication context, the components that branch on auth status, and
the post create/edit machinery all lose their reason to exist.

## Rules For Removal

The three status components are treated differently, because they mean
different things:

| Component | Treatment |
|---|---|
| `AuthLoggedIn` | Remove the element **and its children**. Authenticated-only UI. |
| `AuthRecognized` | Remove the element **and its children**. Returning-visitor-only UI. |
| `AuthGuest` | Remove the element, **keep its children**. Guest UI always showed for everyone. |

`SecurePage` is removed outright; it exists only to gate a page behind login.

## Scope

### Component and page layer

Deleted entirely:

- `components/auth/` — all ten files: `AuthenticationContext.jsx`,
  `AuthGuest.jsx`, `AuthLoggedIn.jsx`, `AuthRecognized.jsx`,
  `CheckAuthButton.jsx`, `LoginButton.jsx`, `LogoutButton.jsx`,
  `LoginModal.jsx`, `LoginModal.module.scss`, `SecurePage.jsx`
- `components/EditPost.jsx`, `components/EditPostView.jsx`,
  `components/EditLink.jsx`, `components/DeleteLink.jsx`,
  `components/EditableField.jsx`, `components/EditTitleImage.jsx`,
  `components/EditTitleImage.module.scss`
- `components/PostViewContext.jsx`
- `components/pages/CreatePostPage.jsx`, `components/pages/EditPostPage.jsx`
- `pages/create/`, `pages/edit/`, `pages/login/`

Edited:

- `pages/_app.js` — drop the `AuthenticationContext` import and its wrapper.
  The remaining provider nesting is otherwise unchanged.
- `components/templates/SiteNavigationHeader.jsx` — drop the `AuthRecognized`
  and `AuthLoggedIn` blocks with their contents. That empties the enclosing
  `<FeatureEnabled feature="userLogin">`, so it goes too. The `navSearch`
  block stays.
- `components/PostMetaInfo.jsx` — drop the `AuthLoggedIn` block containing the
  edit and delete links, and the now-unused `EditLink`, `DeleteLink`, and
  `usePostViewContext` imports.

### Model layer

- `lib/api/AuthenticationManager.js` deleted. `lib/api/` holds nothing else,
  so the directory goes.
- `model/PostDao.js` — delete `createPost`, `publishPost`, `updatePost`,
  `deletePost`. The private helpers `#auth`, `#sendPost`, and `#api` are
  reachable only from those four methods, so they are deleted with them. Read
  methods and `#cleanFetch` are untouched.
- `model/CachingPostDao.js` — delete the `createPost`, `publishPost`, and
  `updatePost` passthroughs. There is no `deletePost` passthrough to remove.
- `siteconfig.json` — delete `api.endpoints.auth` (`login`, `check`) and
  `api.endpoints.entries.create`, `.publish`, `.update`, `.delete`. `api.root`
  and the read endpoints stay.
- `package.json` — remove `react-dropzone`, whose only importer is the deleted
  `EditTitleImage.jsx`.

### Collapsing PostViewContext

With the `EDIT` view gone, `PostViewContext` cannot change state: nothing
calls `toEditView` or `toReaderView` once `PostMetaInfo`'s authenticated block
is deleted. It degenerates into a wrapper that always renders `ReadPostView`,
and the only surviving difference between its two remaining views is the
`showNextPrev` flag. Both call sites render `ReadPostView` directly instead:

- `components/LogEntries.jsx` — `<ReadPostView post={e} showNextPrev={false}/>`
- `components/pages/SinglePostPage.jsx` — `<ReadPostView post={post} showBody={true} next={next} prev={prev} showNextPrev={true}/>`

`usePostViewContext` and the `View` enum are deleted with the file.
`ReadPostView` itself needs no change.

## Explicitly Out Of Scope

- `Modal` and `ModalProvider` stay. `components/search/Search.jsx` and
  `components/github/RepoReadme.jsx` both use them.
- Everything under `app/api/` stays. No API route calls a `PostDao` write
  method.
- Server-side write side effects stay.
- `js-cookie`, `react-query`, and `react-router-dom` are already unreferenced
  before this change. They are pre-existing orphans and are left alone.
- The `userLogin` LaunchDarkly flag is not touched in LaunchDarkly. After this
  change no code reads it, so Chris archives it there by hand.

## Pre-Existing Breakage Found While Surveying

Recorded because it explains why some of this code cannot be smoke-tested
before deletion, not as work to do:

- `components/pages/EditPostPage.jsx` calls `useDataContext()` without
  importing it, and declares `apostDao` while referencing `postDao`. The
  `/edit/[postId]` route cannot render today.
- `pages/create/index.jsx` imports `SecurePage` but never uses it, so
  `/create` is currently ungated.
- `components/EditableField.jsx` is imported by nothing. It is already dead
  code, independent of this change. It is deleted here because it is an inline
  post-editing control and so falls inside the stated scope, not because this
  change orphaned it.

All three files are being deleted, so none is fixed.

## Testing

Deleted:

- `__tests__/components/auth/AuthenticationContext.test.js`
- `__tests__/components/auth/LoginModal.test.js`

The directory `__tests__/components/auth/` goes with them.

Edited — `__tests__/_app.test.js`: drop the `AuthenticationContext` mock and
the assertion that it renders. The other five provider assertions stay.

Added — assertions that encode the read-only end state, written before the
deletions so they fail first. Neither component has a test file today; both are
new:

- `__tests__/components/PostMetaInfo.test.js` — renders tags, date, and comment
  count, and renders no edit or delete control.
- `__tests__/components/templates/SiteNavigationHeader.test.js` — renders no
  login, logout, or new-entry control.

**Both assertions must be set up to fail before the deletion, or they are
worthless.** Each guarded block is invisible by default in a test environment,
so a naive assertion would pass against the current code and prove nothing:

- `PostMetaInfo`'s edit and delete links sit inside `AuthLoggedIn`, which
  renders `null` unless status is `authenticated`. The test must mock the
  authentication context to `STATUS.authenticated` so the links render, making
  "no edit control" genuinely fail. After the deletion the mock is moot and is
  removed from the test.
- `SiteNavigationHeader`'s login block sits inside both `AuthRecognized` and
  `<FeatureEnabled feature="userLogin">`. The test must mock `useFlags` to
  `{ userLogin: true }` *and* the auth status, mirroring the existing pattern in
  `__tests__/components/auth/LoginModal.test.js`. After the deletion only the
  flag mock is needed, and only to prove the control stays gone even with the
  flag on.

Per project convention these retrieve elements with `getByTestId`, never by
user-visible text, which means both components need `data-testid` attributes
where they currently have none. Adding those attributes is part of the work.

### Verification

`npm test`, `npm run lint`, and `npm run build` must all pass. Test output
must be clean — no stray console errors from removed code paths.

### End-to-end tests

The repo has no e2e framework: there is no `playwright` or `cypress`
dependency, only an orphaned `playwright-report/` directory. Chris has
explicitly authorized skipping e2e tests for this work and will verify by hand
that `/create`, `/edit/*`, and `/login` are gone. This is a deliberate,
granted exception to the NO EXCEPTIONS policy in `CLAUDE.md`, recorded here so
it is not mistaken for an oversight.

## Commit Sequence

Four commits, each leaving the suite green:

1. Rewrite tests to describe the read-only site. New assertions fail.
2. Delete the auth components, edit machinery, and the three pages. Tests pass.
3. Collapse `PostViewContext` into direct `ReadPostView` use.
4. Cut the model layer: `AuthenticationManager`, `PostDao` and
   `CachingPostDao` writes, `siteconfig.json` endpoints, `react-dropzone`.

Rejected: one large commit, which puts roughly twenty-five files beyond
review; and file-by-file commits, whose intermediate states do not build.
