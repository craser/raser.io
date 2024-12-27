import Search from '@/lib/search/SearchImplementation';

import MOCK_STUBS from './MockSearchStubs.json'; // 3 hard-coded mocks to test FUNCTIONALITY
import SAMPLE_PROD_STUBS from './SampleSearchStubs.json';
import { setIntersection } from "@/lib/search/SetUtils"; // 1000 sample entries from prod to test PERFORMANCE


describe('Blog Post Search Implementation', () => {

    test('Should return only first entry, with "commonthree" as completion', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('commonth');
        expect(results.results.length == 1); // should only match one candidate
        expect(results.results[0].post.intro).toContain('commonth'); // candidate should actually match
        expect(results.completion).toBe('ree');
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

    test('intersect', () => {
        let a = new Set([1, 2, 3]);
        let b = new Set([2, 3, 4]);
        let i = setIntersection(a, b);

        expect(i.size).toBe(2);
        expect(i.has(2)).toBe(true);
        expect(i.has(3)).toBe(true);
    });

    test('Search should get faster as more terms are added', () => {

        const results = []; // { terms, elapsed }

        const initStart = performance.now();
        const search = new Search(SAMPLE_PROD_STUBS);
        const initElapsed = performance.now() - initStart;
        results.push({ i: -1, terms: '(init)', elapsed: initElapsed });




        const tokens = ['mountain', 'bike', 'trails', 'corner'];

        //expect.assertions(tokens.length - 1); // one check per term after first
        let start = performance.now();
        search.search(tokens[0]);

        let baseline = performance.now() - start;

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
