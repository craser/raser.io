// ABOUTME: Tests that the tag listing page lists a tag's posts the way the archive lists all posts.
// ABOUTME: Resolves the tag from the router alone, with no build-time props.

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TagPage from '@/pages/tags/[tag]';

const captured = {};
let mockRouter = {};

jest.mock('next/router', () => ({
    useRouter: () => mockRouter
}));

jest.mock('@/components/templates/StandardLayout', () => ({
    __esModule: true,
    default: ({ content }) => <div data-testid="standard-layout">{content}</div>
}));

jest.mock('@/components/templates/SingleSectionContent', () => ({
    __esModule: true,
    default: ({ content }) => <div data-testid="single-section">{content}</div>
}));

jest.mock('@/components/LogEntries', () => ({
    __esModule: true,
    default: (props) => {
        captured.logEntries = props;
        return <div data-testid="log-entries"/>;
    }
}));

jest.mock('@/components/LoadingSpinner', () => ({
    __esModule: true,
    default: () => <div data-testid="loading-spinner"/>
}));

describe('Tag listing page', () => {
    beforeEach(() => {
        mockRouter = { isReady: true, query: { tag: 'joshuatree' } };
        Object.keys(captured).forEach(k => delete captured[k]);
    });

    it('does not export getStaticProps or getStaticPaths', () => {
        const page = require('@/pages/tags/[tag]');
        expect(page.getStaticProps).toBeUndefined();
        expect(page.getStaticPaths).toBeUndefined();
    });

    it('lists the tag\'s posts with the archive\'s layout and page size', () => {
        const { getByTestId } = render(<TagPage/>);
        expect(getByTestId('standard-layout')).toContainElement(getByTestId('log-entries'));
        expect(captured.logEntries.tag).toBe('joshuatree');
        expect(captured.logEntries.initialPage).toBe(0);
        expect(captured.logEntries.pageSize).toBe(30);
    });

    it('shows a spinner until the router knows the tag', () => {
        mockRouter = { isReady: false, query: {} };
        const { getByTestId, queryByTestId } = render(<TagPage/>);
        expect(getByTestId('loading-spinner')).not.toBeNull();
        expect(queryByTestId('log-entries')).toBeNull();
    });
});
