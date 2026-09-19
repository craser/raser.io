// ABOUTME: Unit tests for the PageSection component covering the sticky title
// ABOUTME: container layout, content wrapper, background icon, and hero mode.

import PageSection from '@/components/frontpage/PageSection';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

function renderScaffold(props = {}) {
    return render(<PageSection title="Previously" {...props} />);
}

describe('PageSection', () => {

    it('should render the title inside the sticky title container', () => {
        const result = renderScaffold({ title: 'Previously' });

        const container = result.getByTestId('page-section-title-container');
        const title = result.getByTestId('page-section-title');

        expect(container).toContainElement(title);
        expect(title.tagName).toBe('H2');
        expect(title.textContent).toBe('Previously');
    });

    it('should leave section sizing to the stylesheet rather than inline styles', () => {
        const result = renderScaffold();

        const section = result.getByTestId('page-section');
        expect(section.getAttribute('style')).toBeNull();
    });

    it('should leave hero section sizing to the stylesheet rather than inline styles', () => {
        const result = renderScaffold({ hero: true });

        const section = result.getByTestId('page-section');
        expect(section.getAttribute('style')).toBeNull();
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
