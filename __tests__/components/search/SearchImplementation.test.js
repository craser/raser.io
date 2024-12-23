import Search, { toRegex } from '@/lib/search/SearchImplementation';

import MOCK_STUBS from './MockSearchStubs.json'; // 3 hard-coded mocks to test FUNCTIONALITY
import SAMPLE_PROD_STUBS from './SampleSearchStubs.json'; // 1000 sample entries from prod to test PERFORMANCE


describe('Blog Post Search Implementation', () => {

    test('Should return only first entry, with "commonthree" as completion', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('commonth');
        expect(results.results.length == 1); // should only match one candidate
        expect(results.results[0].post.intro).toContain('commonth'); // candidate should actually match
        expect(results.completion).toBe('ree');
    });

    test('Regex should always match input token', () => {
        let token = 'common';
        const re = toRegex(token);
        expect(re.test(token)).toBe(true);
    });

    test('Should match all mock entries', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('common');
        expect(results.results.length).toBe(MOCK_STUBS.length);
    });

    test('Should match single word in searchable text', () => {
        const STUB = {
            "entryId": 103,
            "datePosted": "2022-06-22T13:00:00.000+00:00",
            "intro": "commonone",
            "body": null
        };
        const search = new Search([STUB])
        const results = search.search('common');
        expect(results.results.length).toEqual(1);
    })

    test('Should recommend the most-used completion', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('common');
        expect(results.completion).toBe('one');
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
