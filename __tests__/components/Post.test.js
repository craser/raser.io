// ABOUTME: Tests that Post renders a post's intro and body through PostToHtml,
// ABOUTME: so relative links come out root-relative and a clicked video thumbnail starts the video.

import { Post } from '@/components/Post';
import { fireEvent, render } from '@testing-library/react';

jest.mock('@/components/PostLink', () => ({ PostLink: ({ children }) => <span>{children}</span> }));
jest.mock('@/components/PostMetaInfo', () => () => null);
const mockPostTitleImageProps = [];
jest.mock('@/components/PostTitleImage', () => function MockPostTitleImage(props) {
    mockPostTitleImageProps.push(props);
    return null;
});

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

    it('preloads the title image only when asked to', () => {
        mockPostTitleImageProps.length = 0;
        render(<Post post={mockPost} showBody={false}/>);
        expect(mockPostTitleImageProps[0].preload).toBeFalsy();

        mockPostTitleImageProps.length = 0;
        render(<Post post={mockPost} showBody={false} preloadTitleImage={true}/>);
        expect(mockPostTitleImageProps[0].preload).toBe(true);
    });

    it('omits the body when showBody is false', () => {
        const { queryByTestId } = render(<Post post={mockPost} showBody={false}/>);
        expect(queryByTestId('body-link')).toBeNull();
    });

    it('plays a video when its thumbnail is clicked', () => {
        const post = { ...mockPost, body: '<iframe src="https://www.youtube.com/embed/abc123"></iframe>' };
        const { getByTestId, queryByTestId } = render(<Post post={post} showBody={true}/>);

        fireEvent.click(getByTestId('youtube-facade'));

        expect(queryByTestId('youtube-facade')).toBeNull();
        expect(getByTestId('youtube-embed').getAttribute('src')).toBe('https://www.youtube.com/embed/abc123?autoplay=1');
    });

    it('listens for resizes once per post, and stops when it goes away', () => {
        const add = jest.spyOn(window, 'addEventListener');
        const remove = jest.spyOn(window, 'removeEventListener');
        const resizeAdds = () => add.mock.calls.filter(([type]) => type === 'resize');

        const { rerender, unmount } = render(<Post post={mockPost} showBody={true}/>);
        rerender(<Post post={mockPost} showBody={true}/>);
        expect(resizeAdds()).toHaveLength(1);

        unmount();
        expect(remove).toHaveBeenCalledWith('resize', resizeAdds()[0][1]);
        add.mockRestore();
        remove.mockRestore();
    });
});
