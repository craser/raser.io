// ABOUTME: Tests that the single-post page resolves its id from the router alone.
// ABOUTME: Guards against getStaticPaths/getStaticProps being reintroduced while the data layer is being reworked.

import { render } from '@testing-library/react';
import PostIdParamPage from '@/pages/archive/[postId]';

const captured = {};
let mockQuery = {};

jest.mock('next/router', () => ({
    useRouter: () => ({ query: mockQuery, isFallback: false })
}));

jest.mock('@/components/pages/SinglePostPage', () => ({
    __esModule: true,
    default: (props) => {
        captured.singlePostPage = props;
        return <div data-testid="single-post-page"/>;
    }
}));

jest.mock('@/components/LoadingSpinner', () => ({
    __esModule: true,
    default: () => <div data-testid="loading-spinner"/>
}));

describe('Single post page', () => {
    beforeEach(() => {
        mockQuery = {};
        Object.keys(captured).forEach(k => delete captured[k]);
    });

    it('does not export getStaticPaths', () => {
        const page = require('@/pages/archive/[postId]');
        expect(page.getStaticPaths).toBeUndefined();
    });

    it('does not export getStaticProps', () => {
        const page = require('@/pages/archive/[postId]');
        expect(page.getStaticProps).toBeUndefined();
    });

    it('renders the post once the router supplies the id', () => {
        mockQuery = { postId: '4' };
        const { getByTestId } = render(<PostIdParamPage/>);
        expect(getByTestId('single-post-page')).not.toBeNull();
        expect(captured.singlePostPage.postId).toBe('4');
    });

    it('shows the spinner before the router has resolved the id', () => {
        mockQuery = {};
        const { getByTestId } = render(<PostIdParamPage/>);
        expect(getByTestId('loading-spinner')).not.toBeNull();
    });
});
