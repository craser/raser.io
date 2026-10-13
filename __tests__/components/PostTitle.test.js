// ABOUTME: Tests for PostTitle, the heading that renders a blog post title with a
// ABOUTME: one-time scramble animation when it scrolls into view.

import { render } from "@testing-library/react";
import PostTitle from "@/components/PostTitle";

const post = { title: 'A Post About Coffee' };

describe('PostTitle', () => {

    test('Should render an h1 by default', () => {
        const result = render(<PostTitle post={post} />);
        expect(result.getByTestId('post-title').tagName).toBe('H1');
    });

    test('Should render the requested heading element', () => {
        const result = render(<PostTitle post={post} as="h3" />);
        expect(result.getByTestId('post-title').tagName).toBe('H3');
    });

    test('Should render the real title text before any animation', () => {
        const result = render(<PostTitle post={post} />);
        expect(result.getByTestId('scramble-text').textContent).toBe('A Post About Coffee');
    });

    test('Should carry the real title as aria-label', () => {
        const result = render(<PostTitle post={post} />);
        expect(result.getByTestId('post-title').getAttribute('aria-label')).toBe('A Post About Coffee');
    });

    test('Should apply the className', () => {
        const result = render(<PostTitle post={post} className="title" />);
        expect(result.getByTestId('post-title').className).toBe('title');
    });

    test('Should render an empty title for a post without one', () => {
        const result = render(<PostTitle post={{}} />);
        expect(result.getByTestId('scramble-text').textContent).toBe('');
    });
});
