import { Post } from '@/components/Post';
import { render } from '@testing-library/react';

jest.mock('@/components/PostLink', () => ({ PostLink: ({ children }) => <span>{children}</span> }));
jest.mock('@/components/PostMetaInfo', () => () => null);
jest.mock('@/components/PostTitleImage', () => () => null);

const mockPost = {
    title: 'DUMMY_TITLE',
    intro: '<a href="archive/1">intro link</a>',
    body: '<a href="archive/2">body link</a>',
};

describe('Post', () => {
    it('renders the intro with relative links made root-relative', () => {
        const { getByText } = render(<Post post={mockPost} showBody={false}/>);
        expect(getByText('intro link').getAttribute('href')).toBe('/archive/1');
    });

    it('renders the body with relative links made root-relative', () => {
        const { getByText } = render(<Post post={mockPost} showBody={true}/>);
        expect(getByText('body link').getAttribute('href')).toBe('/archive/2');
    });

    it('omits the body when showBody is false', () => {
        const { queryByText } = render(<Post post={mockPost} showBody={false}/>);
        expect(queryByText('body link')).toBeNull();
    });
});
