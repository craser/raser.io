/**
 * Returns an array of search results: { post, text }
 *
 * Matches if the text contains all the tokens.
 */
export default function search(searchTerms, candidates) {
    const tokenMatchers = searchTerms
        .split(/\s+/)
        .map(t => new RegExp(`\\b${t}`, 'i'));


    const results = candidates.filter(result => tokenMatchers.every(matcher => matcher.test(result.text)));
    const typeAheadSuggestion = 'suggestion'; // TODO: implement this
    return {
        typeAheadSuggestion,
        results,
    }
}
