// ABOUTME: Tests that the archive index renders without build-time props.
// ABOUTME: Guards against getStaticProps being reintroduced while the data layer is being reworked.

import { render } from '@testing-library/react';
import Archive from '@/pages/archive/index';

const captured = {};

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

describe('Archive index page', () => {
    beforeEach(() => {
        Object.keys(captured).forEach(k => delete captured[k]);
    });

    it('does not export getStaticProps', () => {
        const page = require('@/pages/archive/index');
        expect(page.getStaticProps).toBeUndefined();
    });

    it('renders without any props', () => {
        const { getByTestId } = render(<Archive/>);
        expect(getByTestId('log-entries')).not.toBeNull();
    });

    it('leaves LogEntries to fetch its own entries', () => {
        render(<Archive/>);
        expect(captured.logEntries.initialEntries).toBeUndefined();
    });

    it('still tells LogEntries which page and page size to use', () => {
        render(<Archive/>);
        expect(captured.logEntries.initialPage).toBe(0);
        expect(captured.logEntries.pageSize).toBe(30);
    });
});
