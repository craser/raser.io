/**
 * ABOUTME: Tests for the landing front page layout's slots and their order.
 * ABOUTME: Mocks StandardLayout to render its content directly; CSS ordering is covered by the e2e test.
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FrontLandingLayout from '@/components/templates/FrontLandingLayout';

jest.mock('@/components/templates/StandardLayout', () => ({
    __esModule: true,
    default: ({ content }) => <div data-testid="standard-layout">{content}</div>
}));

const slots = {
    latest: <div data-testid="latest"/>,
    github: <section data-testid="github"/>,
    listening: <section data-testid="listening"/>,
    previous: <section data-testid="previous"/>
};

describe('FrontLandingLayout', () => {
    test('places listening between github and previous', () => {
        render(<FrontLandingLayout {...slots}/>);

        const order = ['github', 'listening', 'previous'].map((id) => screen.getByTestId(id));
        expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(order[1].compareDocumentPosition(order[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('wraps listening so the stylesheet can reorder it on mobile', () => {
        render(<FrontLandingLayout {...slots}/>);
        expect(screen.getByTestId('listening').parentElement).toHaveClass('listening');
    });

    test('leaves the listening wrapper empty when there is nothing to show, so CSS can hide it', () => {
        const { container } = render(<FrontLandingLayout {...slots} listening={null}/>);
        expect(container.querySelector('.listening')).toBeEmptyDOMElement();
    });

    test('has no social slot', () => {
        render(<FrontLandingLayout {...slots} social={<div data-testid="social"/>}/>);
        expect(screen.queryByTestId('social')).toBeNull();
    });
});
