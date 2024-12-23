import { extractText } from "@/lib/search/TextProcessing";

export function toRegex(token) {
    const matcher = new RegExp(`\\b(?=\\w{3})[\\w-]*${token}[\\w-]*\\b`, 'ig');
    return matcher;
}

/**
 * Search object to handle state related to successive searches, and to manage
 * search data.
 */
export default class Search {
    candidates;

    constructor(candidates) {
        this.candidates = toSearchCandidates(candidates);
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

        const results = searchTokens.reduce((cs, t) => this.filterCandidates(cs, t), this.candidates);
        const completion = suggestCompletion(searchTokens, results);

        return { results, completion };
    }

    filterCandidates(candidates, token) {
        const matcher = toRegex(token);
        return candidates.filter(c => {
            const matches = this.match(c, matcher);
            return matches;
        });
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

function suggestCompletion(tokens, candidates) {
    const lastToken = tokens[tokens.length - 1];
    const matcher = toRegex(lastToken);
    let matchCounts = candidates.reduce((counts, candidate) => {
        candidate.text.replaceAll(matcher, (match) => {
            if (!counts[match]) {
                counts[match] = 1;
            } else {
                counts[match] += 1;
            }
        });
        return counts;
    }, {})

    let max = 0;
    let completion = '';
    Object.keys(matchCounts)
        .forEach(match => {
            const count = matchCounts[match];
            if (count > max) {
                max = count;
                completion = match.substring(lastToken.length);
            } else if (count === max && match < completion) { // FIXME: potentially expensive
                completion = match.substring(lastToken.length);
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

