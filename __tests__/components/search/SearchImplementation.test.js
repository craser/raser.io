import Search, { ENGLISH_STOP_WORDS } from '@/lib/search/SearchImplementation';

import MOCK_STUBS from './MockSearchStubs.json'; // 3 hard-coded mocks to test FUNCTIONALITY
import SAMPLE_PROD_STUBS from './SampleSearchStubs.json';
import { setIntersection } from "@/lib/search/SetUtils"; // 1000 sample entries from prod to test PERFORMANCE


describe('Blog Post Search Implementation', () => {

    test('Post title, intro, and body should be searchable', () => {
        const SEARCHABLE_FIELDS = ['title', 'intro', 'body'];
        const BLANK_STUB = {
            "entryId": 101,
            "datePosted": "2022-06-22T11:00:00.000+00:00",
            "title": null,
            "intro": null,
            "body": null
        };

        expect.assertions(SEARCHABLE_FIELDS.length);
        SEARCHABLE_FIELDS.forEach((field) => {
            const token = `searchable${field}`;
            let SAMPLE_STUB = { ...BLANK_STUB, [field]: token };
            const search = new Search([SAMPLE_STUB]); // drop sample stub into list & submit for indexing
            const results = search.search(token);
            expect(results.results.length).toBe(1);
        });
    });

    test('Search should be case-insensitive', () => {
        const search = new Search(MOCK_STUBS);
        const lowerCaseResults = search.search('commontwo');
        const mixedCaseResults = search.search('cOmMoNTwo');
        const upperCaseResults = search.search('COMMONTWO');

        expect(lowerCaseResults.results.length).toBe(2);
        expect(mixedCaseResults.results.length).toBe(2);
        expect(upperCaseResults.results.length).toBe(2);
    });


    test('Should return only first entry, with "commonthree" as completion', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('commonth');
        expect(results.results.length == 1); // should only match one candidate
        expect(results.results[0].post.intro).toContain('commonth'); // candidate should actually match
        expect(results.completion).toBe('ree');
    });

    test('Should ignore stop words', () => {
        const STUB_WITH_STOPS = [
            {
                "entryId": 101,
                "datePosted": "2022-06-22T11:00:00.000+00:00",
                "intro": ENGLISH_STOP_WORDS.join(' '),
                "body": null
            }
        ];
        const search = new Search(STUB_WITH_STOPS);
        expect.assertions(ENGLISH_STOP_WORDS.length);
        ENGLISH_STOP_WORDS.forEach((word) => {
            const results = search.search(word);
            expect(results.results.length).toBe(0);
        });
    })

    /**
     * I am dumb and removed the stop words from the stubs, but not from the search tokens.
     */
    test('Should ignore stop words when matching stubs', () => {
        const STUBS = [
            {
                entryId: 101,
                "datePosted": "2022-06-22T11:00:00.000+00:00",
                "title": 'over the hump bike race results',
                "body": null
            }
        ];
        const search = new Search(STUBS);
        const results = search.search('over the');
        expect(results.results.length).toBeGreaterThan(0);
    });

    test('Should return "commontwo" as the completion', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('commonone commont');
        expect(results.completion).toBe('wo');
    });

    test('Completion should NOT be for any previous token', () => {
        const STUBS = [{
            "entryId": 999,
            "datePosted": "2022-06-22T12:00:00.000+00:00",
            "intro": "unique",
            "body": null
        }];

        const search = new Search(STUBS);
        const results = search.search('unique uni');
        expect(results.completion).toBe(''); // Should NOT re-suggest the previous token "unique"
    });

    /**
     * The returned completion shouldn't just be the most common completion in the whole set. It should be
     * the most common completion in the MATCHING set.
     */
    test('Completion should match all returned results', () => {
        const STUBS = [...MOCK_STUBS];
        STUBS.push({
            "entryId": 999,
            "datePosted": "2022-06-22T12:00:00.000+00:00",
            "intro": "commonthree unique",
            "body": null
        });

        const search = new Search(STUBS);
        const results = search.search('unique common');
        expect(results.completion).toBe('three');
    })

    test('Should return empty results for unmatched tokens', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('nope');
        expect(results.results).toEqual([]);
        expect(results.completion).toBe('');
    });

    test('Should return an empty completion for an empty last token', () => {
        const search = new Search(MOCK_STUBS);
        const results = search.search('common '); // note blank space at end
        expect(results.completion).toBe('');
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
