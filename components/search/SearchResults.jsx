import styles from './Search.module.scss'
import React from "react";
import { useSearchContext } from "@/components/search/SearchProvider";
import { useRouter } from "next/router";
import { getPostLink } from "@/components/PostLink";

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
export default function SearchResults({ pageSize = 5 }) {
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
            {results.map(({ post, text }, i) => (
                <SearchResult data-testclass="search-result" key={i} post={post} terms={terms} text={text}/>
            ))}
        </div>
    );
}

export function SearchResult({ terms, post, text }) {
    const searchContext = useSearchContext();
    const router = useRouter();
    const go = () => {
        searchContext.showSearchUi(false);
        router.push(getPostLink(post));
    }

    return (
        <div data-testclass="search-result" className={styles.searchResult} onClick={go}>
            <div className={styles.searchResultTitle}>{post.title}</div>
            <div className={styles.searchResultsMetaData}>
                <SearchResultPostedDate datePosted={post.datePosted}/>
                <SearchResultMatchedTerms terms={terms} text={text}/>
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


    const matched = (terms || '')
        .split(/\s+/)
        .filter(t => text.indexOf(t) >= 0);

    return (
        <div data-testclass="search-matched-terms" className={styles.searchResultMatchedTerms}>
            {matched.map(((term, i) => (<span key={i} className={styles.searchResultTerm}>{term}</span>)))}
        </div>
    );
}
