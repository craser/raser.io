import { extractText } from "@/lib/search/TextProcessing";
import SearchTrie from "@/lib/search/SearchTrie";
import { setIntersection } from "@/lib/search/SetUtils";

/**
 * Search object to handle state related to successive searches, and to manage
 * search data.
 */
export default class Search {
    candidates = [];
    candidatesById = {};
    trie = new SearchTrie();

    constructor(stubs) {
        this.candidates = toSearchCandidates(stubs);
        this.candidates.forEach(c => {
            this.candidatesById[c.post.entryId] = c;
            const word = /\b\w+\b/g;
            c.text.replaceAll(word, (w) => {
                this.trie.insert(w, c.post.entryId);
            });
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
            ? searchTokens.split(/\s/).filter(t => t)
            : searchTokens;
        const results = this.getSearchResults(searchTokens);
        const completion = this.getRecommendedSearchCompletion(searchTokens);
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
        const matches = candidate.text.match(matcher); // avoid alternating tru
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
 * @param entries: Array of post objects
 * @returns {{post, text: string}}
 */
const toSearchCandidates = entries => entries.map(post => ({ post, text: extractText(post) }));


