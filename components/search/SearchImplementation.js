/**
 * Returns an object:
 * {
 *     results: Array of { post, text }
 *     typeAheadSuggestion: recommended text completion
 * }
 *
 * Matches if the text contains all the tokens.
 */
export default function search(searchTerms, candidates) {
    const startTime = new Date().getTime();
    const searchTokens = searchTerms.split(/\s+/);
    const lastToken = searchTokens[searchTokens.length - 1];
    const tokenMatchers = searchTokens.map(t => new RegExp(`\\b[\\w-]*${t}[\\w-]*\\b`, 'ig'));
    const lastTokenMatcher = new RegExp(`\\b${lastToken}[\\w-]*\\b`, 'ig');

    const matchCounts = {};
    const results = [];

    candidates.forEach(candidate => {
        let include = tokenMatchers.every(matcher => matcher.test(candidate.text));
        if (include) {
            results.push(candidate);
            candidate.text.replaceAll(lastTokenMatcher, (match) => {
                matchCounts[match] = (matchCounts[match] || 0) + 1;
            });
        }
    });

    const completion = suggestCompletion(searchTerms, matchCounts);
    console.debug(`search completed in ${new Date().getTime() - startTime}ms`, {
        searchTerms,
        completion,
        results: results.length
    });
    return {
        completion,
        results,
    }
}

function suggestCompletion(searchTerms, matchCounts) {
    let lastTerm = searchTerms.split(/\s+/).reverse()[0];
    let max = 0;
    let completion = '';
    Object.keys(matchCounts)
        .filter(match => match.startsWith(lastTerm))
        .forEach(match => {
            const count = matchCounts[match];
            if (count > max) {
                max = count;
                completion = match.substring(lastTerm.length);
            } else if (count === max && match < completion) { // FIXME: potentially expensive
                completion = match.substring(lastTerm.length);
            }
        });
    return completion;
}
