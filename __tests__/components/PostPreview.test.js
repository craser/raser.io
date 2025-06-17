import { PostPreview } from '@/components/PostPreview';
import { render } from '@testing-library/react';

jest.mock('@/components/PostPreview.module.scss', () => ({}));

const mockPost = {
    title: 'DUMMY_TITLE',
    intro: 'DUMMY_INTRO',
    body: 'DUMMY_BODY',
}

describe('PostPreview', () => {
    it('Should render', () => {
        const results = render(<PostPreview post={mockPost} />);
        expect(results.findByTestId('postPreview')).not.toBeNull();
    });
    
    it('Should NOT render if post is null', () => {
        const results = render(<PostPreview />);
        expect(results.container.getElementsByClassName('postPreview').length).toBe(0);
    });
});



