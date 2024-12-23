import { extractText } from "@/lib/search/TextProcessing";

/**
 * Search object to handle state related to successive searches, and to manage
 * search data.
 */
export default class Search {

    candidates;

    constructor(candidates) {
        this.candidates = toSearchCandidates(candidates);
    }

    search(searchTerms) {
        return search(searchTerms, this.candidates);
    }
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
function search(searchTerms, candidates) {
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


function compileSearchMetaData(candidates, tokenMatchers, matchCounts) {
    return candidates.reduce((results, post) => {
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
}

function metaComparator(a, b) {
    return b.numMatches - a.numMatches;
};

