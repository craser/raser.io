import { PostHeader } from '@/components/PostHeader';
import { render } from '@testing-library/react';

jest.mock('@/components/frontpage/PreviousPosts.module.scss', () => ({}));

jest.mock('lucide-react', () => ({
    ChevronRight: () => <span>→</span>
}));

const mockYouTubePost = {
    entryId: 3420,
    title: 'DUMMY_TITLE',
    intro: '<iframe src="https://www.youtube.com/embed/abc123XYZ"></iframe>',
    body: 'DUMMY_BODY',
    imageFileName: null,
};

describe('PostHeader', () => {
    it('Should render the YouTube title image for a post with a YouTube embed and no title image', () => {
        const results = render(<PostHeader post={mockYouTubePost} />);
        const img = results.getByTestId('youtube-title-image');
        expect(img.getAttribute('src')).toBe('https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg');
    });
});
