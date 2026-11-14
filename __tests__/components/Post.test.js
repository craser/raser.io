// ABOUTME: Tests that Post renders a post's intro and body through PostToHtml,
// ABOUTME: so relative links in post HTML come out root-relative.

import { Post } from '@/components/Post';
import { render } from '@testing-library/react';

jest.mock('@/components/PostLink', () => ({ PostLink: ({ children }) => <span>{children}</span> }));
jest.mock('@/components/PostMetaInfo', () => () => null);
jest.mock('@/components/PostTitleImage', () => () => null);

const mockPost = {
    title: 'DUMMY_TITLE',
    intro: '<a data-testid="intro-link" href="archive/1">intro link</a>',
    body: '<a data-testid="body-link" href="archive/2">body link</a>',
};

describe('Post', () => {
    it('renders the intro with relative links made root-relative', () => {
        const { getByTestId } = render(<Post post={mockPost} showBody={false}/>);
        expect(getByTestId('intro-link').getAttribute('href')).toBe('/archive/1');
    });

    it('renders the body with relative links made root-relative', () => {
        const { getByTestId } = render(<Post post={mockPost} showBody={true}/>);
        expect(getByTestId('body-link').getAttribute('href')).toBe('/archive/2');
    });

    it('omits the body when showBody is false', () => {
        const { queryByTestId } = render(<Post post={mockPost} showBody={false}/>);
        expect(queryByTestId('body-link')).toBeNull();
    });
});
