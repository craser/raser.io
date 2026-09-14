// ABOUTME: Tests that the home page renders without build-time props and defers to client-side loading.
// ABOUTME: Guards against getStaticProps being reintroduced while the data layer is being reworked.

import { render } from '@testing-library/react';
import Home from '@/pages/index';

const captured = {};

jest.mock('@/components/templates/FrontLandingLayout', () => ({
    __esModule: true,
    default: ({ latest, previous }) => <div data-testid="front-landing">{latest}{previous}</div>
}));

jest.mock('@/components/templates/StandardLayout', () => ({
    __esModule: true,
    default: ({ content }) => <div data-testid="standard-layout">{content}</div>
}));

jest.mock('@/components/frontpage/LatestPost', () => ({
    __esModule: true,
    default: (props) => {
        captured.latestPost = props;
        return <div data-testid="latest-post"/>;
    }
}));

jest.mock('@/components/frontpage/PreviousPosts', () => ({
    __esModule: true,
    default: (props) => {
        captured.previousPosts = props;
        return <div data-testid="previous-posts"/>;
    }
}));

jest.mock('@/components/LogEntries', () => ({
    __esModule: true,
    default: (props) => {
        captured.logEntries = props;
        return <div data-testid="log-entries"/>;
    }
}));

jest.mock('@/components/github/GithubActivity', () => ({
    __esModule: true,
    default: () => <div data-testid="github-activity"/>
}));

jest.mock('@/components/frontpage/SocialFeed', () => ({
    __esModule: true,
    default: () => <div data-testid="social-feed"/>
}));

jest.mock('@/components/flags/FeatureEnabled', () => ({
    __esModule: true,
    default: ({ children, override }) => {
        captured.featureEnabledOverride = override;
        return <div data-testid="feature-enabled">{children}</div>;
    }
}));

jest.mock('@/components/flags/FeatureDisabled', () => ({
    __esModule: true,
    default: ({ children, override }) => {
        captured.featureDisabledOverride = override;
        return <div data-testid="feature-disabled">{children}</div>;
    }
}));

describe('Home page', () => {
    beforeEach(() => {
        Object.keys(captured).forEach(k => delete captured[k]);
    });

    it('does not export getStaticProps', () => {
        const page = require('@/pages/index');
        expect(page.getStaticProps).toBeUndefined();
    });

    it('does not export getServerSideProps', () => {
        const page = require('@/pages/index');
        expect(page.getServerSideProps).toBeUndefined();
    });

    it('renders without any props', () => {
        const { getByTestId } = render(<Home/>);
        expect(getByTestId('front-landing')).not.toBeNull();
    });

    it('leaves LatestPost to fetch its own post', () => {
        render(<Home/>);
        expect(captured.latestPost.initialPost).toBeUndefined();
    });

    it('leaves PreviousPosts to fetch its own posts', () => {
        render(<Home/>);
        expect(captured.previousPosts.initialPosts).toBeUndefined();
    });

    it('leaves LogEntries to fetch its own entries', () => {
        render(<Home/>);
        expect(captured.logEntries.initialEntries).toBeUndefined();
    });

    it('passes no flag override, so the real feature flag governs the layout', () => {
        render(<Home/>);
        expect(captured.featureEnabledOverride).toBeUndefined();
        expect(captured.featureDisabledOverride).toBeUndefined();
    });
});
