// ABOUTME: Tests that a compact search stub - searchable words instead of HTML fields - searches exactly like the full post.
// ABOUTME: Compares results, their order, completions and the matched words shown, across 1000 sample production posts.

import Search, { ENGLISH_STOP_WORDS } from '@/lib/search/SearchImplementation';
import { uniqueWords } from '@/lib/search/TextProcessing';
import { toSearchStub } from '@/lib/search/SearchStub';
import SAMPLE_PROD_STUBS from '@/__tests__/components/search/SampleSearchStubs.json';

const STOP_WORDS = new Set(ENGLISH_STOP_WORDS);

const QUERIES = [
    'race', 'rac', 'bike', 'bik', 'ride', 'the', 'over the hump', 'over hump', 'joshua tree',
    'spotify', 'mountain', 'mtb', 'run', 'running', 'climb', 'santa', 'cal', 'march', 'lorem',
    'video', 'notes', 'race notes', 'don', 'xyzzy', 'e-bike', 'trail', 'tra', 'gps', 'map',
];

/** The words SearchResultMatchedTerms would show for these terms against this text. */
function matchedWords(terms, text) {
    return terms.toLowerCase().split(/\s+/).filter(Boolean)
        .map(token => (text.match(new RegExp(`\\b${token}\\w*\\b`)) || [null])[0]);
}

describe('uniqueWords', () => {
    it('keeps each word once, in the order it first appears', () => {
        expect(uniqueWords('the cat and the hat, the end')).toBe('the cat and hat end');
    });

    it('splits on non-word characters the way the search index does', () => {
        expect(uniqueWords("don't e-bike")).toBe('don t e bike');
    });

    it('returns an empty string for empty text', () => {
        expect(uniqueWords('')).toBe('');
    });
});

describe('toSearchStub', () => {
    const post = {
        entryId: 7, title: 'A <b>Title</b>', datePosted: '2024-01-01 00:00:00.000000',
        intro: '<p>The intro intro</p>', body: '<p>Body &amp; title of it</p>', attachments: [{}], tags: ['x'],
    };

    it('carries only the fields search results show, plus the searchable words without stop words', () => {
        expect(toSearchStub(post)).toEqual({
            entryId: 7,
            title: 'A <b>Title</b>',
            datePosted: '2024-01-01 00:00:00.000000',
            text: 'title intro body',
        });
    });
});

describe('a compact stub searches like the full post', () => {
    const full = new Search(SAMPLE_PROD_STUBS);
    const compact = new Search(SAMPLE_PROD_STUBS.map(toSearchStub));

    it('is a small fraction of the full payload', () => {
        const fullSize = JSON.stringify(SAMPLE_PROD_STUBS).length;
        const compactSize = JSON.stringify(SAMPLE_PROD_STUBS.map(toSearchStub)).length;
        expect(compactSize / fullSize).toBeLessThan(0.5);
    });

    it.each(QUERIES)('"%s" finds the same posts in the same order, with the same completion', (query) => {
        const a = full.search(query);
        const b = compact.search(query);
        expect(b.results.map(r => r.post.entryId)).toEqual(a.results.map(r => r.post.entryId));
        expect(b.completion).toEqual(a.completion);
    });

    // The compact text has no stop words, so a term can no longer be shown matching one.
    // Every other matched word is the same.
    it.each(QUERIES)('"%s" shows the same matched words for each result, apart from stop words', (query) => {
        const a = full.search(query).results;
        const b = compact.search(query).results;
        a.forEach((result, i) => {
            const fullWords = matchedWords(query, result.text);
            const compactWords = matchedWords(query, b[i].text);
            fullWords.forEach((word, j) => {
                if (!STOP_WORDS.has(word)) {
                    expect(compactWords[j]).toEqual(word);
                }
            });
        });
    });

    it('has queries that find results, so the comparison means something', () => {
        expect(QUERIES.filter(q => full.search(q).results.length > 0).length).toBeGreaterThan(10);
    });
});
