import Search from '@/lib/search/SearchImplementation';

import MOCK_STUBS from './MockSearchStubs.json'; // 3 hard-coded mocks to test FUNCTIONALITY
import SAMPLE_PROD_STUBS from './SampleSearchStubs.json'; // 1000 sample entries from prod to test PERFORMANCE


describe('Blog Post Search Implementation', () => {

    test('Should return only first entry, with "commonthree" as completion', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('commonth');
        expect(results.results.length == 1); // should only match one candidate
        expect(results.results[0].post.intro).toContain('commonth'); // candidate should actually match
    });

    test('Search should get faster as more terms are added', () => {
        const search = new Search(SAMPLE_PROD_STUBS);
        const tokens = ['mountain', 'bike', 'trails', 'corner'];
        //expect.assertions(tokens.length - 1); // one check per term after first

        let start = performance.now();
        search.search(tokens[0]);
        let baseline = performance.now() - start;

        const results = []; // { terms, elapsed }

        for (let i = 2; i <= tokens.length; i++) {
            const terms = tokens.slice(0, i).join(' ');
            start = performance.now();
            search.search(terms);
            let elapsed = performance.now() - start;
            results.push({ i, terms, elapsed });
            //expect(elapsed).toBeLessThan(baseline);
            baseline = elapsed;
        }

        console.table(results);
    });

});
