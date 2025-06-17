import NextPrevPostLinks from '@/components/NextPrevPostLinks';
import { render } from '@testing-library/react'

jest.mock('lucide-react' ,() => ({}));


jest.mock('@/components/Post.module.scss', () => ({
    nextLink: 'nextLink',
    prevLink: 'prevLink'
}));

jest.mock('@/components/PostPreview.module.scss', () => ({}));

const mockNextPost = {
    title: 'DUMMY_TITLE_NEXT',
    intro: 'DUMMY_INTRO_NEXT',
    body: 'DUMMY_BODY_NEXT',
}

const mockPrevPost = {
    title: 'DUMMY_TITLE_PREV',
    intro: 'DUMMY_INTRO_PREV',
    body: 'DUMMY_BODY_PREV',
}


describe('NextPrevPostLinks', () => {
    it('should render two links (next, prev) when both are provided', () => {
        const results = render(<NextPrevPostLinks nextPost={mockNextPost} prevPost={mockPrevPost} />);
        expect(results.findByTestId('postPreview')).resolves.toHaveProperty('length', 2);
        expect(results.container.getElementsByClassName('nextLink').length).toBe(1);
        expect(results.container.getElementsByClassName('prevLink').length).toBe(1);
    });
    
    it('should render only one link (next) when only next is provided', () => {
        const results = render(<NextPrevPostLinks nextPost={mockNextPost} />);
        expect(results.findByTestId('postPreview')).resolves.toHaveProperty('length', 1);
        expect(results.container.getElementsByClassName('nextLink').length).toBe(1);
        expect(results.container.getElementsByClassName('prevLink').length).toBe(0);
        
    });

    it('should render only one link (prev) when only prev is provided', () => {
        const results = render(<NextPrevPostLinks prevPost={mockPrevPost} />);
        expect(results.findByTestId('postPreview')).resolves.toHaveProperty('length', 1);
        expect(results.container.getElementsByClassName('nextLink').length).toBe(0);
        expect(results.container.getElementsByClassName('prevLink').length).toBe(1);
    });
    
    it('should render nothing when no posts are provided', () => {
        const results = render(<NextPrevPostLinks />);
        expect(results.findByTestId('postPreview')).resolves.toHaveProperty('length', 0);
        expect(results.container.getElementsByClassName('nextLink').length).toBe(0);
        expect(results.container.getElementsByClassName('prevLink').length).toBe(0);
    });
    
});
