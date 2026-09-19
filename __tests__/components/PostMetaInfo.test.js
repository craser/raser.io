// ABOUTME: Verifies PostMetaInfo renders post details and no post-mutating controls.
// ABOUTME: PostMetaInfo depends on neither auth nor PostViewContext, so nothing else is mocked.
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';
import PostMetaInfo from '@/components/PostMetaInfo';

jest.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: jest.fn(),
    withLDProvider: (config) => (Component) => Component
}));

// jest-css-modules-transform compiles this file's real Sass, which can't resolve the
// "@/" alias used by Post.module.scss's own @import. Mocked here the same way other
// component tests in this suite mock it (see NextPrevPostLinks.test.js).
jest.mock('@/components/Post.module.scss', () => ({}));

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

    it('renders no post-mutating controls', () => {
        const { getByTestId } = render(<PostMetaInfo post={mockPost}/>);
        expect(getByTestId('post-meta-info').children.length).toBe(1);
    });
});
