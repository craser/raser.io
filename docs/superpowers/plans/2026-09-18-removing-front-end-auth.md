# Removing Front-End Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make raser.io read-only from the front end by removing the authentication context, every component that branches on auth status, the post create/edit machinery, and the client-side write plumbing beneath them.

**Architecture:** Pure deletion, worked inward from the leaves. Each task removes one component's auth dependency and proves it with a test, so no task leaves the tree importing a file the previous task deleted. The `AuthGuest` / `AuthRecognized` / `AuthLoggedIn` distinction is the one real rule: guest children survive, the other two take their children with them. In this repo that rule turns out to have no work to do — see below.

**Tech Stack:** Next.js 13 Pages Router, React 18, Jest + Testing Library + jsdom, SCSS Modules, LaunchDarkly client SDK.

**Spec:** `docs/superpowers/specs/2026-09-18-removing-front-end-auth-design.md`

## Global Constraints

- Branch is `removing-auth`. It was clean at the start of this work. Commit after every task.
- 4-space indentation in all JS, JSX, JSON, and config files. ESLint enforces it.
- Every file created must open with two `// ABOUTME: ` comment lines.
- Retrieve DOM elements in tests with `getByTestId` / `queryByTestId` only. Never `getByText`, `getByPlaceholderText`, or any lookup that depends on text inside the element.
- Never remove a code comment unless it is provably false. Update comments that a change makes stale.
- Match the style of surrounding code over any external standard.
- Test output must be pristine. `jest.setup.js` already stubs `console`, so a passing run prints no stray errors.
- Baseline to preserve or improve: **38 suites, 303 tests passing**; `npm run lint` reports warnings but zero errors; line coverage 62.17%.
- Do not touch anything under `app/api/`, and do not touch `Modal` or `ModalProvider` — `components/search/Search.jsx` and `components/github/RepoReadme.jsx` depend on them.
- Do not remove `js-cookie`, `react-query`, or `react-router-dom`. They were already unreferenced before this work and are out of scope.

## Deviation From The Spec's Commit Sequence

The spec proposed 4 commits, the first being "rewrite all the tests up front." That does not survive contact with the code: an assertion like "`PostMetaInfo` renders no edit control" **passes against today's code** because `AuthLoggedIn` returns `null` in a test environment anyway. Such a test proves nothing and would never go red.

Each new test therefore has to mock auth *on* so the doomed control actually renders and the assertion genuinely fails — and that mock has to come back out in the same task, once the component no longer imports the auth module. Test and deletion are one unit of work.

This plan is 6 tasks / 6 commits instead of 4. Same end state, same scope, nothing added or dropped. The ordering is load-bearing: see the note on each task.

## The AuthGuest Rule Preserves Nothing Here

You asked that `AuthGuest` elements be removed while anything inside them stays,
since that content shows for everyone anyway. Worth knowing before execution:
**there is no such content.** `AuthGuest`'s only production use in the entire repo
is inside `SecurePage`, where it wraps `<LoginModal/>` — and both of those files
are deleted. Nothing is being lifted out and preserved, because nothing qualifies.

The rule is still honoured: no guest-visible markup is lost anywhere. It simply
has nothing to act on. Confirm this still holds before Task 5:

```bash
grep -rn "AuthGuest" --include="*.js" --include="*.jsx" . | grep -v node_modules
```

Expect hits only in `components/auth/AuthGuest.jsx`,
`components/auth/SecurePage.jsx`, and
`__tests__/components/auth/AuthenticationContext.test.js` — all three deleted. If
`AuthGuest` appears anywhere else, its children **must** be lifted out before the
element is removed, and this plan needs a task for that.

## File Structure

| File | Fate | Why it is in this task order |
|---|---|---|
| `components/PostMetaInfo.jsx` | Modify | Task 1. Only caller of `usePostViewContext`; must lose it before Task 3 deletes that context. |
| `components/templates/SiteNavigationHeader.jsx` | Modify | Task 2. Only consumer of `LoginButton`/`LogoutButton`; must lose them before Task 5 deletes them. |
| `components/PostViewContext.jsx` | Delete | Task 3. Imports `EditPostView`; must go before Task 4 deletes it. |
| `components/LogEntries.jsx`, `components/pages/SinglePostPage.jsx` | Modify | Task 3. The two call sites, moved to `ReadPostView`. |
| `components/EditPost.jsx`, `EditPostView.jsx`, `EditLink.jsx`, `DeleteLink.jsx`, `EditableField.jsx`, `EditTitleImage.jsx`(+`.module.scss`) | Delete | Task 4. Zero importers once Tasks 1 and 3 land. |
| `components/pages/CreatePostPage.jsx`, `EditPostPage.jsx`, `pages/create/`, `pages/edit/` | Delete | Task 4. |
| `components/auth/` (all 10 files) | Delete | Task 5. Last importers disappear in Task 4. |
| `pages/login/`, `pages/_app.js`, `__tests__/_app.test.js` | Delete / Modify | Task 5. |
| `lib/api/AuthenticationManager.js`, `model/PostDao.js`, `model/CachingPostDao.js`, `siteconfig.json`, `package.json` | Delete / Modify | Task 6. Nothing imports these paths by then. |
| `__tests__/components/PostMetaInfo.test.js` | Create | Task 1. |
| `__tests__/components/templates/SiteNavigationHeader.test.js` | Create | Task 2. |

## A Note On Why Two Assertions Are Structural

`queryByTestId('edit-link')` is useless here: that testid does not exist today, so the assertion is green before the work starts. The controls being removed carry no testid, and adding one to a file we are about to delete is theatre.

So Tasks 1 and 2 assert on **child count of a container that survives**, after giving that container a `data-testid`. Before the deletion the container has two element children (content row + auth row); after, one. That genuinely goes red first, uses only `getByTestId`, and leaves behind a real regression guard: if an authenticated-only row ever comes back, the count breaks. It tests structure rather than behaviour, which is the cost of the `getByTestId` rule meeting an absence assertion. Flagged rather than hidden.

---

### Task 1: PostMetaInfo — drop the authenticated edit/delete row

**Ordering:** Must be first. `PostMetaInfo` is the only caller of `usePostViewContext`, and Task 3 deletes that context.

**Files:**
- Create: `__tests__/components/PostMetaInfo.test.js`
- Modify: `components/PostMetaInfo.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `PostMetaInfo` renders a single container `<div data-testid="post-meta-info">` whose only element child is `<div data-testid="post-meta-info-details">`. After this task `PostMetaInfo` imports neither `PostViewContext` nor anything under `components/auth/`.

- [x] **Step 1: Write the failing test**

Create `__tests__/components/PostMetaInfo.test.js`:

```jsx
// ABOUTME: Verifies PostMetaInfo renders post details and no post-mutating controls.
// ABOUTME: Auth is mocked as authenticated so a surviving edit/delete row would be caught.
import { render } from '@testing-library/react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import PostMetaInfo from '@/components/PostMetaInfo';

jest.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: jest.fn(),
    withLDProvider: (config) => (Component) => Component
}));

// Mocked as AUTHENTICATED on purpose. The edit and delete controls being removed only
// render for a logged-in user, so without this the assertion below would pass against
// the unmodified component and prove nothing.
jest.mock('@/components/auth/AuthenticationContext', () => ({
    STATUS: { authenticated: 'authenticated', recognized: 'recognized', guest: 'guest' },
    useAuthenticationContext: () => ({ status: 'authenticated' })
}));

jest.mock('@/components/PostViewContext', () => ({
    usePostViewContext: () => ({ toEditView: jest.fn(), toReaderView: jest.fn() })
}));

const mockPost = {
    entryId: 'DUMMY_ENTRY_ID',
    title: 'DUMMY_TITLE',
    datePosted: '2026-01-15T12:00:00Z',
    tags: ['DUMMY_TAG'],
    comments: []
};

describe('PostMetaInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useFlags.mockReturnValue({ postCommentCount: true });
    });

    it('renders the post details row', () => {
        const { getByTestId } = render(<PostMetaInfo post={mockPost}/>);
        expect(getByTestId('post-meta-info-details')).toBeInTheDocument();
    });

    it('renders no post-mutating controls, even for an authenticated user', () => {
        const { getByTestId } = render(<PostMetaInfo post={mockPost}/>);
        expect(getByTestId('post-meta-info').children.length).toBe(1);
    });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npm test -- PostMetaInfo`

Expected: the first test FAILS (`post-meta-info-details` testid does not exist yet). The second test FAILS with `expect(received).toBe(expected) // Expected: 1, Received: 2` — the second child is the `AuthLoggedIn` row holding the edit and delete links. Both failures are required. If the second test passes at this step, the auth mock is not taking effect: stop and fix the mock before continuing.

- [x] **Step 3: Remove the authenticated row and add the testids**

Replace the whole of `components/PostMetaInfo.jsx` with:

```jsx
import styles from "@/components/Post.module.scss";
import DatePosted from "@/components/DatePosted";
import CommentsLink from "@/components/CommentsLink";
import PostTagsList from "@/components/PostTagsList";
import FeatureEnabled from '@/components/flags/FeatureEnabled';

export default function PostMetaInfo(props) {
    let { post } = props;
    return (
        <div data-testid="post-meta-info" className={styles.entryMetaInfoContainer}>
            <div data-testid="post-meta-info-details" className={styles.entrymetainfo}>
                <PostTagsList post={post} className={styles.tagslist}/>
                <DatePosted post={post}/>
                <FeatureEnabled feature="postCommentCount"> • <CommentsLink post={post}/></FeatureEnabled>
            </div>
        </div>
    );
}
```

Note what went: the `AuthLoggedIn` element **and its children** (per the spec's rule for `AuthLoggedIn`), plus the now-unused `AuthLoggedIn`, `EditLink`, `DeleteLink`, and `usePostViewContext` imports and the `toEditView` destructuring.

- [x] **Step 4: Remove the two now-pointless mocks from the test**

In `__tests__/components/PostMetaInfo.test.js`, delete both the `@/components/auth/AuthenticationContext` mock block (including its two explanatory comment lines) and the `@/components/PostViewContext` mock block. `PostMetaInfo` no longer imports either module.

Then change the second test's name, since "even for an authenticated user" no longer means anything once there is no such concept:

```jsx
    it('renders no post-mutating controls', () => {
```

- [x] **Step 5: Run the tests to verify they pass**

Run: `npm test -- PostMetaInfo`
Expected: PASS, 2 tests.

- [x] **Step 6: Run the full suite**

Run: `npm test`
Expected: all suites pass. Test count rises from 303 to 305.

- [x] **Step 7: Commit**

```bash
git add components/PostMetaInfo.jsx __tests__/components/PostMetaInfo.test.js
git commit -m "REMOVING-AUTH: drop the authenticated edit/delete row from PostMetaInfo

The edit and delete links only ever rendered for a logged-in user. With
front-end authoring gone they have no audience, so the AuthLoggedIn element
goes along with its children.

PostMetaInfo was the only caller of usePostViewContext, so it is now free of
that dependency too, which clears the way for collapsing PostViewContext.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: SiteNavigationHeader — drop the login, logout, and new-entry controls

**Ordering:** Must precede Task 5. This is the only consumer of `LoginButton` and `LogoutButton`.

**Files:**
- Create: `__tests__/components/templates/SiteNavigationHeader.test.js`
- Modify: `components/templates/SiteNavigationHeader.jsx`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `SiteNavigationHeader` renders `<div data-testid="site-nav">` containing only the search nav item. No `userLogin` flag check remains anywhere in the component.

- [x] **Step 1: Write the failing test**

Create `__tests__/components/templates/SiteNavigationHeader.test.js`:

```jsx
// ABOUTME: Verifies SiteNavigationHeader renders only the search control.
// ABOUTME: Both the userLogin flag and auth status are mocked ON so a surviving login control would be caught.
import { render } from '@testing-library/react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import SiteNavigationHeader from '@/components/templates/SiteNavigationHeader';

jest.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: jest.fn(),
    withLDProvider: (config) => (Component) => Component
}));

// SearchButton reaches for the search context, which is not what this test is about.
jest.mock('@/components/search/SearchButton', () => {
    return function MockSearchButton() {
        return <div data-testid="mock-search-button"/>;
    };
});

// Mocked as RECOGNIZED on purpose: that is the status that renders the login control,
// so without this the child-count assertion would pass against the unmodified component.
jest.mock('@/components/auth/AuthenticationContext', () => ({
    STATUS: { authenticated: 'authenticated', recognized: 'recognized', guest: 'guest' },
    useAuthenticationContext: () => ({ status: 'recognized', showLoginModal: jest.fn(), logout: jest.fn() })
}));

describe('SiteNavigationHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // userLogin deliberately ON. The nav must stay free of login controls regardless.
        useFlags.mockReturnValue({ navSearch: true, userLogin: true });
    });

    it('renders the search control', () => {
        const { getByTestId } = render(<SiteNavigationHeader/>);
        expect(getByTestId('mock-search-button')).toBeInTheDocument();
    });

    it('renders no authentication controls, even with the userLogin flag on', () => {
        const { getByTestId } = render(<SiteNavigationHeader/>);
        expect(getByTestId('site-nav').children.length).toBe(1);
    });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npm test -- SiteNavigationHeader`

Expected: the first test **passes** — `navSearch` is mocked on, so `mock-search-button` already renders. The second test **FAILS** with `expect(received).toBe(expected) // Expected: 1, Received: 2`; the extra child is the `AuthRecognized` nav item holding `LoginButton`. That single failure is the point of this step. If it passes here, the auth or flag mock is not taking effect — stop and fix the mock before touching the component.

- [x] **Step 3: Remove the authentication blocks**

Replace the whole of `components/templates/SiteNavigationHeader.jsx` with:

```jsx
import standardStyles from "@/components/templates/StandardLayout.module.scss";
import SearchButton from "@/components/search/SearchButton";
import FeatureEnabled from "@/components/flags/FeatureEnabled";

export default function SiteNavigationHeader({ styles = standardStyles }) {
    return (
        <div data-testid="site-nav" className={styles.sitenav}>
            <FeatureEnabled feature="navSearch">
                <div className={styles.navitem}>
                    {/* I'm really annoyed with myself for blending the components like this. */}
                    <SearchButton className={styles.searchButton}/>
                </div>
            </FeatureEnabled>
        </div>
    );
}
```

Three things went: the `AuthRecognized` block with its `LoginButton` child, the `AuthLoggedIn` block with its new-entry `Link` and `LogoutButton` children, and the `<FeatureEnabled feature="userLogin">` wrapper that contained both and is now empty. The `next/link` import goes with the new-entry link. The `navSearch` block and its existing comment are untouched.

- [x] **Step 4: Remove the now-pointless auth mock from the test**

In `__tests__/components/templates/SiteNavigationHeader.test.js`, delete the `@/components/auth/AuthenticationContext` mock block and its two explanatory comment lines. `SiteNavigationHeader` no longer imports that module.

Keep everything else, including the `useFlags` mock with `userLogin: true` and the comment above it. Both test names stay as written: "even with the userLogin flag on" is still exactly what the second test proves, since that flag may well still be live in LaunchDarkly.

- [x] **Step 5: Run the tests to verify they pass**

Run: `npm test -- SiteNavigationHeader`
Expected: PASS, 2 tests.

- [x] **Step 6: Run the full suite**

Run: `npm test`
Expected: all suites pass. Test count 307.

- [x] **Step 7: Commit**

```bash
git add components/templates/SiteNavigationHeader.jsx __tests__/components/templates/SiteNavigationHeader.test.js
git commit -m "REMOVING-AUTH: drop login, logout, and new-entry controls from the site nav

Removes the AuthRecognized and AuthLoggedIn blocks with their children. The
enclosing FeatureEnabled check on userLogin wrapped nothing else, so it goes
too; no code reads that flag after this.

The test leaves userLogin mocked on, so the nav is held to staying clean even
if the flag is still live in LaunchDarkly.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Collapse PostViewContext into direct ReadPostView use

**Ordering:** After Task 1 (which removed the last `usePostViewContext` caller) and before Task 4 (which deletes `EditPostView`, imported here).

**Files:**
- Delete: `components/PostViewContext.jsx`
- Modify: `components/LogEntries.jsx:4,65`
- Modify: `components/pages/SinglePostPage.jsx:7,53`

**Interfaces:**
- Consumes: `PostMetaInfo` free of `usePostViewContext` (Task 1).
- Produces: `EditPostView` has zero importers, which Task 4 relies on. `ReadPostView({ post, showBody, next, prev, showNextPrev })` is unchanged and is now called directly.

**Why:** with the `EDIT` view gone, nothing calls `toEditView` or `toReaderView`, so the view state can never transition. The component reduces to a wrapper that always renders `ReadPostView`, and the only difference between its two reachable views is the `showNextPrev` flag.

- [x] **Step 1: Confirm nothing else consumes the context**

Run:
```bash
grep -rn "PostViewContext\|usePostViewContext" --include="*.js" --include="*.jsx" . | grep -v node_modules
```
Expected: hits only in `components/PostViewContext.jsx` itself, `components/LogEntries.jsx`, and `components/pages/SinglePostPage.jsx`. If `PostMetaInfo.jsx` still appears, Task 1 is incomplete — go back.

- [x] **Step 2: Point LogEntries at ReadPostView**

In `components/LogEntries.jsx`, replace the import on line 4:

```jsx
import ReadPostView from "@/components/ReadPostView";
```

and the map on line 65:

```jsx
            {entries.map(e => <ReadPostView key={e.entryId} post={e} showNextPrev={false}/>)}
```

The `View.ENTRY_LIST` case passed `showNextPrev={false}` and left `showBody` undefined, so both are preserved: `showBody` stays absent.

- [x] **Step 3: Point SinglePostPage at ReadPostView**

In `components/pages/SinglePostPage.jsx`, replace the import on line 7:

```jsx
import ReadPostView from "@/components/ReadPostView";
```

and line 53:

```jsx
                    <ReadPostView post={post} showBody={true} next={next} prev={prev} showNextPrev={true}/>
```

The default `View.SINGLE_ENTRY` case passed `showNextPrev={true}`, so that is now explicit.

Leave the file's pre-existing unused `Fragment`, `PostDao`, `Post`, and `NextPrevPostLinks` imports alone. They were dead before this change and tidying them is unrelated work.

- [x] **Step 4: Delete the context**

```bash
git rm components/PostViewContext.jsx
```

- [x] **Step 5: Add prop-contract tests for both call sites**

**Why this step exists.** The obvious safety net is not there. `__tests__/pages/index.test.js:35`
mocks `@/components/LogEntries` wholesale and `__tests__/pages/archive/postId.test.js:14` mocks
`@/components/pages/SinglePostPage` wholesale, so neither test renders the code this task edits.
Without the tests below, a wrong prop — list entries growing next/prev navigation, or post pages
losing it — ships silently past a green suite, a clean lint, and a successful build. The entire
content of this refactor is preserving two prop differences, so those two props are what to test.

Neither component needs a stylesheet mock: `LogEntries` imports its SCSS relatively, which
resolves to `identity-obj-proxy`, and `SinglePostPage` imports none.

Create `__tests__/components/LogEntries.test.js`:

```jsx
// ABOUTME: Guards the props LogEntries hands to ReadPostView for each list entry.
// ABOUTME: List entries must render without next/prev navigation.
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogEntries from '@/components/LogEntries';

const mockReadPostViewProps = [];

jest.mock('@/components/ReadPostView', () => {
    return function MockReadPostView(props) {
        mockReadPostViewProps.push(props);
        return <div data-testid={`mock-read-post-view-${props.post.entryId}`}/>;
    };
});

jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: () => ({ firePageView: jest.fn(), fireReferrer: jest.fn() })
}));

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({
        getPostDao: () => ({ getEntries: jest.fn().mockResolvedValue([]) })
    })
}));

const mockEntries = [{ entryId: 'DUMMY_ENTRY_ID', title: 'DUMMY_TITLE' }];

describe('LogEntries', () => {
    beforeEach(() => {
        mockReadPostViewProps.length = 0;
        global.IntersectionObserver = class {
            observe() {}
            disconnect() {}
        };
    });

    it('renders a ReadPostView for each entry', () => {
        const { getByTestId } = render(<LogEntries initialEntries={mockEntries} pageSize={10}/>);
        expect(getByTestId('mock-read-post-view-DUMMY_ENTRY_ID')).toBeInTheDocument();
    });

    it('renders list entries without next/prev navigation', () => {
        render(<LogEntries initialEntries={mockEntries} pageSize={10}/>);
        expect(mockReadPostViewProps[0].showNextPrev).toBe(false);
    });
});
```

Create `__tests__/components/pages/SinglePostPage.test.js`:

```jsx
// ABOUTME: Guards the props SinglePostPage hands to ReadPostView for a single post.
// ABOUTME: A single post must render its full body with next/prev navigation.
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SinglePostPage from '@/components/pages/SinglePostPage';

const mockReadPostViewProps = [];

jest.mock('@/components/ReadPostView', () => {
    return function MockReadPostView(props) {
        mockReadPostViewProps.push(props);
        return <div data-testid="mock-read-post-view"/>;
    };
});

jest.mock('@/components/templates/StandardLayout', () => {
    return function MockStandardLayout({ content }) {
        return <div data-testid="mock-standard-layout">{content}</div>;
    };
});

jest.mock('@/components/templates/SingleSectionContent', () => {
    return function MockSingleSectionContent({ content }) {
        return <div data-testid="mock-single-section-content">{content}</div>;
    };
});

jest.mock('@/components/analytics/AnalyticsProvider', () => ({
    useAnalytics: () => ({ firePageView: jest.fn(), fireReferrer: jest.fn() })
}));

jest.mock('@/components/api/DataProvider', () => ({
    useDataContext: () => ({
        getPostDao: () => ({
            getPostById: jest.fn().mockResolvedValue({ entryId: 'DUMMY_ENTRY_ID', title: 'DUMMY_TITLE' }),
            getNextPost: jest.fn().mockResolvedValue(null),
            getPrevPost: jest.fn().mockResolvedValue(null)
        })
    })
}));

describe('SinglePostPage', () => {
    beforeEach(() => {
        mockReadPostViewProps.length = 0;
    });

    it('renders the post once it loads', async () => {
        const { getByTestId } = render(<SinglePostPage postId="DUMMY_ENTRY_ID"/>);
        await waitFor(() => expect(getByTestId('mock-read-post-view')).toBeInTheDocument());
    });

    it('renders the full body with next/prev navigation', async () => {
        const { getByTestId } = render(<SinglePostPage postId="DUMMY_ENTRY_ID"/>);
        await waitFor(() => expect(getByTestId('mock-read-post-view')).toBeInTheDocument());
        expect(mockReadPostViewProps[0].showBody).toBe(true);
        expect(mockReadPostViewProps[0].showNextPrev).toBe(true);
    });
});
```

Note the `mock` prefix on `mockReadPostViewProps`: Jest forbids a `jest.mock` factory from closing
over an out-of-scope variable unless its name begins with `mock`.

- [x] **Step 6: Verify the suite and the build**

Run: `npm test`
Expected: all suites pass. The four new tests bring the count to **311 tests across 42 suites** (303 baseline + 2 from Task 1 + 2 from Task 2 + 4 here).

Run: `npm run build`
Expected: compiles with no module-resolution errors.

- [x] **Step 7: Commit**

```bash
git add components/LogEntries.jsx components/pages/SinglePostPage.jsx \
        __tests__/components/LogEntries.test.js __tests__/components/pages/SinglePostPage.test.js
git commit -m "REMOVING-AUTH: collapse PostViewContext into direct ReadPostView use

Without the EDIT view nothing calls toEditView or toReaderView, so the view
state could never change and the provider always resolved to ReadPostView. The
only difference between the two reachable views was the showNextPrev flag, now
passed explicitly at both call sites.

Adds a prop-contract test per call site. Neither path had coverage: the
page-level tests mock LogEntries and SinglePostPage wholesale, so a wrong
showNextPrev would have shipped past a green suite and a clean build.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Delete the post create/edit machinery and its pages

**Ordering:** After Task 3 (so `EditPostView` has no importer) and before Task 5 (these files import `useAuthenticationContext`).

**Files:**
- Delete: `components/EditPost.jsx`, `components/EditPostView.jsx`, `components/EditLink.jsx`, `components/DeleteLink.jsx`, `components/EditableField.jsx`, `components/EditTitleImage.jsx`, `components/EditTitleImage.module.scss`
- Delete: `components/pages/CreatePostPage.jsx`, `components/pages/EditPostPage.jsx`
- Delete: `pages/create/index.jsx`, `pages/edit/[postId].js`

**Interfaces:**
- Consumes: `PostViewContext` gone (Task 3), `PostMetaInfo` free of `EditLink`/`DeleteLink` (Task 1).
- Produces: nothing outside `components/auth/` imports `useAuthenticationContext` afterwards, which Task 5 depends on.

Two of these were already broken before this work and are being deleted, not fixed: `components/pages/EditPostPage.jsx` calls `useDataContext()` without importing it and declares `apostDao` while referencing `postDao`, so `/edit/[postId]` cannot render today; and `pages/create/index.jsx` imports `SecurePage` without using it, so `/create` is currently ungated.

- [x] **Step 1: Confirm each file is unreferenced outside the set being deleted**

```bash
grep -rn "EditPost\|EditLink\|DeleteLink\|EditableField\|EditTitleImage\|CreatePostPage\|EditPostPage" \
  --include="*.js" --include="*.jsx" . | grep -v node_modules
```
Expected: every hit is inside one of the files listed above. Any hit elsewhere means an earlier task was incomplete — stop and resolve it before deleting.

- [x] **Step 2: Delete the files**

```bash
git rm components/EditPost.jsx \
       components/EditPostView.jsx \
       components/EditLink.jsx \
       components/DeleteLink.jsx \
       components/EditableField.jsx \
       components/EditTitleImage.jsx \
       components/EditTitleImage.module.scss \
       components/pages/CreatePostPage.jsx \
       components/pages/EditPostPage.jsx
git rm -r pages/create pages/edit
```

- [x] **Step 3: Verify the suite, lint, and build**

Run: `npm test`
Expected: all suites pass, 307 tests.

Run: `npm run lint`
Expected: warnings only, zero errors. The warning previously reported for `EditPostPage`'s `useEffect` dependency disappears with the file.

Run: `npm run build`
Expected: compiles. The route list no longer contains `/create` or `/edit/[postId]`.

- [x] **Step 4: Commit**

```bash
git commit -m "REMOVING-AUTH: delete the post create and edit machinery

Authoring moves off the front end, so the edit form, its title-image
dropzone, the create and edit pages, and the edit/delete links go with it.

EditableField was already imported by nothing. It is removed here because it
is an inline post-editing control and so falls in scope, not because this
change orphaned it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Delete components/auth/, the login page, and the provider

**Ordering:** Last consumers disappeared in Tasks 1, 2, and 4.

**Files:**
- Delete: `components/auth/` (all 10 files)
- Delete: `pages/login/index.jsx`
- Delete: `__tests__/components/auth/AuthenticationContext.test.js`, `__tests__/components/auth/LoginModal.test.js`
- Modify: `pages/_app.js:2,15,24`
- Modify: `__tests__/_app.test.js:28-32,81`

**Interfaces:**
- Consumes: no importers of `components/auth/*` outside that directory and `pages/login/`.
- Produces: `App` renders `FeatureFlagProvider > AnalyticsProvider > ModalProvider > DataProvider > SearchProvider`. `lib/api/AuthenticationManager` has no importer, which Task 6 relies on.

- [x] **Step 1: Confirm nothing outside the deletion set imports auth**

```bash
grep -rn "components/auth" --include="*.js" --include="*.jsx" . | grep -v node_modules
```
Expected: hits only inside `components/auth/`, `pages/login/index.jsx`, `pages/_app.js`, `__tests__/_app.test.js`, and the two auth test files. Anything else means an earlier task is incomplete.

- [x] **Step 2: Update the _app test first**

In `__tests__/_app.test.js`, delete the mock block at lines 28-32:

```jsx
jest.mock('@/components/auth/AuthenticationContext', () => {
    return function MockAuthenticationContext({ children }) {
        return (<div data-testid="mock-AuthenticationContext">{children}</div>);
    };
});
```

and the assertion at line 81:

```jsx
        expect(getByTestId('mock-AuthenticationContext')).toBeInTheDocument();
```

The other five provider mocks and assertions stay exactly as they are.

- [x] **Step 3: Run the test to verify it fails**

Run: `npm test -- _app`
Expected: FAIL. `pages/_app.js` still imports `@/components/auth/AuthenticationContext`, and with the mock gone the real module loads and drags in `AuthenticationManager`, `LoginModal`, and the analytics context. The failure confirms the provider is genuinely still wired in.

- [x] **Step 4: Remove the provider from _app**

Replace the whole of `pages/_app.js` with:

```jsx
import '@/styles/globals.scss';
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import SearchProvider from "@/components/search/SearchProvider";
import DataProvider from "@/components/api/DataProvider";
import FeatureFlagProvider from "@/components/flags/FeatureFlagProvider";
import ModalProvider from "@/components/modal/ModalProvider";
import Head from 'next/head';

export default function App({ Component, pageProps }) {
    return (
        <FeatureFlagProvider>
            <AnalyticsProvider>
                <ModalProvider>
                    <DataProvider>
                        <SearchProvider>
                            <Head>
                                <link rel="alternate" type="application/rss+xml" href="/rss"/>
                            </Head>
                            <Component {...pageProps} />
                        </SearchProvider>
                    </DataProvider>
                </ModalProvider>
            </AnalyticsProvider>
        </FeatureFlagProvider>
    );
}
```

The surviving providers keep their relative order. Indentation of the inner block is normalised to 4 spaces per level, which the original had drifted from.

- [x] **Step 5: Run the test to verify it passes**

Run: `npm test -- _app`
Expected: PASS, 4 tests.

- [x] **Step 6: Delete the auth directory, the login page, and the auth tests**

```bash
git rm -r components/auth pages/login __tests__/components/auth
```

That takes `AuthenticationContext.jsx`, `AuthGuest.jsx`, `AuthLoggedIn.jsx`, `AuthRecognized.jsx`, `CheckAuthButton.jsx`, `LoginButton.jsx`, `LogoutButton.jsx`, `LoginModal.jsx`, `LoginModal.module.scss`, and `SecurePage.jsx`.

- [x] **Step 7: Verify the suite, lint, and build**

Run: `npm test`
Expected: all suites pass. The two auth suites go, taking **24 tests** with them (21 in `AuthenticationContext.test.js`, 3 in `LoginModal.test.js`). Count settles at **287 tests across 40 suites** — 303 baseline, plus the 8 added across Tasks 1, 2, and 3, minus those 24. A large drop in test count is the expected shape of this task: those 24 tests exercised behaviour that no longer exists.

Run: `npm run lint`
Expected: warnings only, zero errors.

Run: `npm run build`
Expected: compiles, and the route list no longer contains `/login`.

- [x] **Step 8: Commit**

```bash
git add pages/_app.js __tests__/_app.test.js
git commit -m "REMOVING-AUTH: delete the authentication components and the login page

Removes AuthenticationContext and every component that branched on auth
status, along with the login modal, the login page, and SecurePage. The
provider comes out of _app, so no client code tracks a user any more.

AuthGuest's only use was inside SecurePage, wrapping the login modal, so its
keep-the-children rule had nothing to preserve.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Cut the client write plumbing

**Ordering:** Last. Every caller is gone by now.

**Files:**
- Delete: `lib/api/AuthenticationManager.js` (and the then-empty `lib/api/`)
- Modify: `model/PostDao.js` — remove `createPost`, `publishPost`, `updatePost`, `deletePost`, `#auth`, `#sendPost`, `#api`
- Modify: `model/CachingPostDao.js:89-99` — remove three passthroughs
- Modify: `siteconfig.json` — remove `api.endpoints.auth` and four `entries` write endpoints
- Modify: `package.json` — remove `react-dropzone`

**Interfaces:**
- Consumes: no importer of `AuthenticationManager`; no caller of any DAO write method.
- Produces: `PostDao` and `CachingPostDao` expose read methods only — `getLatestPost`, `getPostById`, `getNextPost`, `getPrevPost`, `getEntries`, `getSearchStubs`.

- [x] **Step 1: Confirm every caller is gone**

```bash
grep -rn "AuthenticationManager\|createPost\|publishPost\|updatePost\|deletePost" \
  --include="*.js" --include="*.jsx" . | grep -v node_modules
```
Expected: hits only inside `lib/api/AuthenticationManager.js`, `model/PostDao.js`, and `model/CachingPostDao.js`. Nothing under `app/`, `pages/`, `components/`, or `__tests__/`.

- [x] **Step 2: Delete the authentication shim**

```bash
git rm lib/api/AuthenticationManager.js
```

`lib/api/` holds nothing else, so git drops the directory.

- [x] **Step 3: Strip the writes from PostDao**

In `model/PostDao.js`, delete the four write methods at lines 116-133 (`createPost`, `publishPost`, `updatePost`, `deletePost`) and the three private helpers `#api` (lines 26-30), `#auth` (lines 32-39), and `#sendPost` (lines 55-66). All three helpers are reachable only from those four methods.

Keep `#cleanFetch` and every `get*` method untouched. After the edit the class body runs: `#config`, the three static factories with their existing `TODO` comment, the constructor, `#cleanFetch`, then the six read methods with their existing comments intact.

- [x] **Step 4: Strip the passthroughs from CachingPostDao**

In `model/CachingPostDao.js`, delete lines 89-99 — the `createPost`, `publishPost`, and `updatePost` passthroughs. There is no `deletePost` passthrough. `getSearchStubs` becomes the last method in the class.

- [x] **Step 5: Remove the dead endpoints from siteconfig.json**

In `siteconfig.json`, delete the whole `api.endpoints.auth` object (both `login` and `check`) and these four keys from `api.endpoints.entries`: `create`, `delete`, `publish`, `update`.

`api.endpoints.entries` keeps `entry`, `latest`, `next`, `previous`, and `bulk`. `api.root` and `api.endpoints.maps` are untouched. Keep 4-space indentation and valid JSON — no trailing comma where `bulk` now ends the object.

- [x] **Step 6: Remove the orphaned dependency**

`react-dropzone` was imported only by the deleted `EditTitleImage.jsx`. Remove its line from `dependencies` in `package.json`, then:

```bash
npm install
```

This rewrites `package-lock.json`. Commit both.

Leave `js-cookie`, `react-query`, and `react-router-dom` in place — already unreferenced before this work, out of scope.

- [x] **Step 7: Verify everything**

```bash
npm test
npm run lint
npm run build
```

Expected: 40 suites and 287 tests pass; lint reports warnings only; the build compiles. `__tests__/model/CachingPostDao.test.js` and `__tests__/lib/SiteConfig.test.js` both still pass — neither covered the write paths, which is why none of this needed new tests.

Coverage should rise rather than fall: `PostDao.js` sat at 0%, and `pages/create`, `pages/edit`, and `pages/login` were all at 0% too, so the `coverage-enforcement.yml` gate has more headroom than before, not less.

- [x] **Step 8: Commit**

```bash
git add model/PostDao.js model/CachingPostDao.js siteconfig.json package.json package-lock.json
git commit -m "REMOVING-AUTH: cut the client-side write plumbing

Removes AuthenticationManager and the PostDao create/publish/update/delete
methods, along with the private #auth, #sendPost, and #api helpers that only
those methods reached. The matching CachingPostDao passthroughs and the auth
and entry-write endpoints in siteconfig.json go too.

react-dropzone had no importer left once the title-image dropzone was
deleted, so it comes out of package.json.

Server-side writes are untouched. PostDao is now read-only.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Final Verification

- [x] `npm test` — 40 suites, 287 tests, output clean of stray console noise
- [x] `npm run lint` — zero errors
- [x] `npm run build` — compiles; route list has no `/create`, `/edit/[postId]`, or `/login`
- [x] `grep -rn "components/auth\|AuthenticationManager\|SecurePage" --include="*.js" --include="*.jsx" . | grep -v node_modules` returns nothing
- [x] `git log --oneline main..HEAD` shows the design-doc commit plus six task commits

## Handoff Notes For Chris

Two items land outside the repo and outside this plan:

1. **Archive the `userLogin` flag in LaunchDarkly.** After Task 2 no code reads it. It is left live deliberately — Task 2's test keeps it mocked on to prove the nav stays clean either way — but it is now dead config.
2. **Verify the dead routes by hand.** `/create`, `/edit/<any-id>`, and `/login` should all 404. You authorised skipping e2e tests for this work, and the repo has no framework to write them in, so this check is yours. `npm run dev`, then hit the three paths.

### No e2e tests, on purpose

`CLAUDE.md`'s NO EXCEPTIONS policy requires unit, integration, and e2e tests. There is no e2e framework here — no `playwright` or `cypress` dependency, only an orphaned `playwright-report/` directory. Chris granted this exception explicitly and took the manual verification. Recorded here and in the spec so it reads as a decision rather than an oversight.
