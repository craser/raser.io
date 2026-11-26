// ABOUTME: Tests that ReadPostView hands the post and its title-image preload flag to Post,
// ABOUTME: and shows next/prev navigation only when asked to.
import { render } from '@testing-library/react';
import ReadPostView from '@/components/ReadPostView';

const mockPostProps = [];

jest.mock('@/components/Post', () => ({
    Post: function MockPost(props) {
        mockPostProps.push(props);
        return null;
    }
}));

jest.mock('@/components/NextPrevPostLinks', () => function MockNextPrevPostLinks() {
    return <div data-testid="mock-next-prev"/>;
});

const POST = { entryId: 1, title: 'DUMMY_TITLE' };

beforeEach(() => {
    mockPostProps.length = 0;
});

test('passes the title-image preload flag through to the post', () => {
    render(<ReadPostView post={POST} showBody={true} preloadTitleImage={true}/>);
    expect(mockPostProps[0].post).toBe(POST);
    expect(mockPostProps[0].preloadTitleImage).toBe(true);
});

test('does not preload the title image unless asked to', () => {
    render(<ReadPostView post={POST} showBody={true}/>);
    expect(mockPostProps[0].preloadTitleImage).toBeFalsy();
});

test('shows next/prev navigation only when asked to', () => {
    const { queryByTestId, rerender } = render(<ReadPostView post={POST} showNextPrev={false}/>);
    expect(queryByTestId('mock-next-prev')).toBeNull();

    rerender(<ReadPostView post={POST} showNextPrev={true}/>);
    expect(queryByTestId('mock-next-prev')).not.toBeNull();
});
