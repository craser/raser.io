import styles from './Search.module.scss'
import React from "react";
import { useSearchContext } from "@/components/search/SearchProvider";

function SearchResultPlaceHolder({ text }) {
    return (
        <div className={styles.emptySearchResult}>
            {text}
        </div>
    )
}

/**
 * @param searchTerms: string
 * @param results: { post, text}[]
 * @param pageSize: number
 * @returns {JSX.Element}
 */
export default function SearchResults({ pageSize = 10, selectedIndex = -1 }) {
    const searchContext = useSearchContext();
    const terms = searchContext.getSearchTerms();
    const results = searchContext.getSearchResults();

    return (
        <div data-testid="search-results" className={styles.searchResults}>
            {(terms.length > 0) && (results.length === 0) && (
                <SearchResultPlaceHolder text={"no results :("}/>
            )}
            {(terms.length === 0) && (results.length === 0) && (
                <SearchResultPlaceHolder text={"enter search terms"}/>
            )}
            {results.slice(0, pageSize).map(({ post, text }, i) => (
                <SearchResult data-testclass="search-result" index={i} key={i} post={post} terms={terms} text={text}/>
            ))}
        </div>
    );
}

export function SearchResult({ terms, post, text, index }) {
    const searchContext = useSearchContext();
    const selected = searchContext.getSelectedResult() === index;
    return (
        <div data-testclass="search-result" className={[styles.searchResult, (selected && styles.selectedResult)].join(' ')}
             onClick={() => searchContext.goToResult(index)}
             onMouseEnter={() => searchContext.setSelectedResult(index)}
        >
            <div className={styles.searchResultTitle}>{post.title}</div>
            <div className={styles.searchResultsMetaData}>
                <SearchResultPostedDate datePosted={post.datePosted}/>
                <SearchResultMatchedTerms terms={terms} text={text} />
            </div>
        </div>
    );
}

function SearchResultPostedDate({ datePosted }) {
    const date = new Date(datePosted);
    const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return <div className={styles.searchResultDate}>{formatted}</div>;
}

export function SearchResultMatchedTerms({ terms, text }) {
    const tokens = terms.toLowerCase().split(/\s+/).filter(Boolean);
    const words = tokens.reduce((words, token) => {
        const re = new RegExp(`\\b${token}\\w*\\b`);
        const match = text.match(re);
        if (match) {
            let matchedWord = match[0];
            words.add(matchedWord);
        }
        return words;
    }, new Set());

    return (
        <div data-testclass="search-matched-terms" className={styles.searchResultMatchedTerms}>
            {[...words].map(((word, i) => (<span key={i} className={styles.searchResultTerm}>{word}</span>)))}
        </div>
    );
}
