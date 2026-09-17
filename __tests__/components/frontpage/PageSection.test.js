// ABOUTME: Unit tests for the PageSection component covering the sticky title
// ABOUTME: container layout, the measured --title-width variable, and hero mode.

import PageSection from '@/components/frontpage/PageSection';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

const MEASURED_TITLE_WIDTH = 137;

function mockTitleWidth(width) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(HTMLHeadingElement.prototype, 'offsetWidth', {
        configurable: true,
        get: () => width
    });
    return () => {
        delete HTMLHeadingElement.prototype.offsetWidth;
        if (descriptor) {
            Object.defineProperty(HTMLElement.prototype, 'offsetWidth', descriptor);
        }
    };
}

function renderScaffold(props = {}) {
    return render(<PageSection title="Previously" {...props} />);
}

describe('PageSection', () => {

    let restoreTitleWidth;

    beforeEach(() => {
        restoreTitleWidth = mockTitleWidth(MEASURED_TITLE_WIDTH);
    });

    afterEach(() => {
        restoreTitleWidth();
    });

    it('should render the title inside the sticky title container', () => {
        const result = renderScaffold({ title: 'Previously' });

        const container = result.getByTestId('page-section-title-container');
        const title = result.getByTestId('page-section-title');

        expect(container).toContainElement(title);
        expect(title.tagName).toBe('H2');
        expect(title.textContent).toBe('Previously');
    });

    it('should publish the measured title width to the section as --title-width', () => {
        const result = renderScaffold();

        const section = result.getByTestId('page-section');
        expect(section.style.getPropertyValue('--title-width')).toBe(`${MEASURED_TITLE_WIDTH}px`);
    });

    it('should not publish --title-width for hero sections, which have no visible title', () => {
        const result = renderScaffold({ hero: true });

        const section = result.getByTestId('page-section');
        expect(section.style.getPropertyValue('--title-width')).toBe('');
        expect(section).toHaveClass('hero');
    });

    it('should render the background icon when a BgIcon is supplied', () => {
        const BgIcon = (props) => <svg data-testid="bg-icon" {...props} />;

        const result = renderScaffold({ BgIcon });

        expect(result.getByTestId('page-section-background')).toContainElement(result.getByTestId('bg-icon'));
    });

    it('should omit the background entirely when no BgIcon is supplied', () => {
        const result = renderScaffold();

        expect(result.queryByTestId('page-section-background')).toBeNull();
    });

    it('should render children in the content wrapper alongside the caller class name', () => {
        const result = renderScaffold({
            className: 'customSection',
            children: <p data-testid="section-child">body copy</p>
        });

        expect(result.getByTestId('page-section-content')).toContainElement(result.getByTestId('section-child'));
        expect(result.getByTestId('page-section')).toHaveClass('customSection', 'pageSection');
    });
});
