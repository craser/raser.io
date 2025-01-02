import { extractText } from "@/lib/search/TextProcessing";
import SearchTrie from "@/lib/search/SearchTrie";
import { setIntersection } from "@/lib/search/SetUtils";

export const ENGLISH_STOP_WORDS = [
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
    'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
    'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
    'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
];

/**
 * Search object to handle state related to successive searches, and to manage
 * search data.
 */
export default class Search {
    candidates = [];
    candidatesById = {};
    trie = new SearchTrie();
    stops = ENGLISH_STOP_WORDS.reduce((stops, w) => {
        stops[w] = true;
        return stops;
    }, {});

    constructor(stubs) {
        this.candidates = toSearchCandidates(stubs);
        this.candidates.forEach(c => {
            this.candidatesById[c.post.entryId] = c;
            const word = /\b\w+\b/g;
            let added = false;
            c.text.replaceAll(word, (w) => {
                if (this.stops[w]) return; // ignore stop words
                added = true;
                this.trie.insert(w, c.post.entryId);
            });
            if (!added) {
                console.log(`stub ${c.post.entryId} doesn't seem to have any searchable content?`, c);
            }
        });
    }


    /**
     * Returns an object:
     * {
     *     results: Array of { post, text }
     *     completion: recommended text completion
     * }
     *
     * Matches if the text contains all the tokens.
     */
    search(searchTokens) {
        searchTokens = (typeof searchTokens === 'string')
            ? searchTokens.split(/\s/).filter(t => t).map(t => t.toLowerCase())
            : searchTokens;
        const completion = this.getRecommendedSearchCompletion(searchTokens);
        const results = this.getSearchResults(searchTokens);
        return { results, completion };
    }

    getRecommendedSearchCompletion(searchTokens) {
        let lastToken = searchTokens[searchTokens.length - 1];
        const { completion } = this.trie.getMostCommonCompletion(lastToken);
        return completion;
    }

    getSearchResults(searchTokens) {
        const ids = searchTokens.slice(1).reduce((ids, token) => {
            return setIntersection(ids, this.trie.getValues(token));
        }, this.trie.getValues(searchTokens[0]));

        const results = Array.from(ids).map(id => this.candidatesById[id]);
        return results;
    }

    match(candidate, matcher) {
        const matches = candidate.text.match(matcher); // avoid alternating true issue
        return matches;
    }
};

/**
 * Pre-processes the given blog posts into "candidates" with the text extracted & sanitized. We do this
 * because:
 *   1. The fields we want to search contain HTML, and we don't want to match against the HTML.
 *   2. While we're at it, it's handy to consolidate the fields we want to search into a single
 *      "text" field.
 *
 * @param stubs: Array of "search stub" objects (basically, abbreviated blog post objects)
 * @returns {{post, text: string}}
 */
const toSearchCandidates = stubs => stubs.map(stub => ({ post: stub, text: extractText(stub) }));


