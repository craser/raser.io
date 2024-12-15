function compileSearchMetaData(candidates, tokenMatchers, matchCounts) {
    const results = candidates.reduce((results, post) => {
        let found = false;
        const result = tokenMatchers.reduce((result, re) => {
            post.text.replaceAll(re, (match) => {
                found = true;
                result.matches[match] = (result.matches[match] || 0) + 1;
                result.numMatches++;
                matchCounts[match] = (matchCounts[match] || 0) + 1;  // aggregate for suggested completion
            });
            return result;
        }, { post, matches: {}, numMatches: 0 });
        if (found) {
            results.push(result);
        }
        return results;
    }, []);
    return results;
}

function metaComparator(a, b) {
    return b.numMatches - a.numMatches;
};


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
    const searchTokens = searchTerms.split(/\s+/).filter(t => t);
    const tokenMatchers = searchTokens.map(t => new RegExp(`\\b(?=\\w{3})[\\w-]*${t}[\\w-]*\\b`, 'ig'));
    const matchCounts = {}; // aggregate
    const meta = compileSearchMetaData(candidates, tokenMatchers, matchCounts)
        .sort(metaComparator);
    const completion = suggestCompletion(searchTerms, matchCounts);
    console.debug(`search completed in ${new Date().getTime() - startTime}ms`, {
        searchTerms,
        completion,
        results: meta.length
    });
    return {
        completion,
        results: meta.map(r => r.post),
    }
}

/**
 * Returns an object that indicates how many of the tokenMatchers matched, and how many times each term matched.
 *
 * @param tokenMatchers
 * @param candidate
 * @return { [term]: count }
 */
function getMatchInfo(tokenMatchers, candidate) {
    const info = {};
    tokenMatchers.forEach(re => {
        candidate.text.replaceAll(re, (match) => {
            info[match] = (info[match] || 0) + 1;
        });
    });
}

function suggestCompletion(searchTerms, matchCounts) {
    const searchTokens = searchTerms.split(/\s+/);
    const lastTerm = searchTokens[searchTokens.length - 1];
    let max = 0;
    let completion = '';
    Object.keys(matchCounts)
        .filter(match => match.startsWith(lastTerm))
        .filter(match => searchTokens.indexOf(match) === -1)
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
