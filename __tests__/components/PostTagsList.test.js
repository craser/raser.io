// ABOUTME: Verifies PostTagsList shows a post's tags, and nothing when the post has none.
// ABOUTME: Tags render as plain text because the site has no per-tag page to link to yet.
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostTagsList from '@/components/PostTagsList';

describe('PostTagsList', () => {
    it('lists each tag', () => {
        const { getAllByRole } = render(<PostTagsList post={{ entryId: 1, tags: ['DUMMY_TAG_A', 'DUMMY_TAG_B'] }}/>);
        expect(getAllByRole('listitem').map(item => item.textContent)).toEqual(['DUMMY_TAG_A', 'DUMMY_TAG_B']);
    });

    it('does not link tags, since there is no tag page', () => {
        const { queryByRole } = render(<PostTagsList post={{ entryId: 1, tags: ['DUMMY_TAG'] }}/>);
        expect(queryByRole('link')).toBeNull();
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
