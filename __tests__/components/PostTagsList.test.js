// ABOUTME: Verifies PostTagsList shows a post's tags, and nothing when the post has none.
// ABOUTME: Each tag links to the page listing that tag's posts.
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostTagsList from '@/components/PostTagsList';

describe('PostTagsList', () => {
    it('lists each tag', () => {
        const { getAllByRole } = render(<PostTagsList post={{ entryId: 1, tags: ['DUMMY_TAG_A', 'DUMMY_TAG_B'] }}/>);
        expect(getAllByRole('listitem').map(item => item.textContent)).toEqual(['DUMMY_TAG_A', 'DUMMY_TAG_B']);
    });

    it('links each tag to its listing page', () => {
        const { getByRole } = render(<PostTagsList post={{ entryId: 1, tags: ['DUMMY_TAG'] }}/>);
        expect(getByRole('link', { name: 'DUMMY_TAG' })).toHaveAttribute('href', '/tags/DUMMY_TAG');
    });

    it('URL-encodes tags in their links', () => {
        const { getByRole } = render(<PostTagsList post={{ entryId: 1, tags: ['at&t 9/11'] }}/>);
        expect(getByRole('link', { name: 'at&t 9/11' })).toHaveAttribute('href', '/tags/at%26t%209%2F11');
    });

    it('renders nothing for a post with no tags', () => {
        const { container } = render(<PostTagsList post={{ entryId: 1, tags: [] }}/>);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the post has no tags field', () => {
        const { container } = render(<PostTagsList post={{ entryId: 1 }}/>);
        expect(container).toBeEmptyDOMElement();
    });
});
