import search, { toSearchCandidates } from '@/lib/search/SearchImplementation';

import MOCK_STUBS from './MockSearchStubs.json'; // 3 hard-coded mocks to test FUNCTIONALITY
import SAMPLE_STUBS from './SampleSearchStubs.json'; // 1000 sample entries from prod to test PERFORMANCE


describe('Blog Post Search Implementation', () => {

    test('Should return only first entry, with "commonthree" as completion', () => {
        const candidates = toSearchCandidates(MOCK_STUBS);
        const results = search('commonth', candidates);
        expect(results.results.length == 1); // should only match one candidate
        expect(results.results[0].post.intro).toContain('commonth'); // candidate should actually match
    });

    test('Check search performance', () => {
        const candidates = toSearchCandidates(SAMPLE_STUBS);
        const terms = 'cornering practice';
        const start = performance.now();
        const results = search(terms, candidates);
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(100);
    });

});
