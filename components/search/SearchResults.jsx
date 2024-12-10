import styles from './Search.module.scss'
import React from "react";
import SearchResult from "@/components/search/SearchResult";
import { useSearchContext } from "@/components/search/SearchContext";

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
        <div className={styles.searchResults}>
            {(terms.length > 0) && (results.length == 0) && (
                <SearchResultPlaceHolder text={"no results :("}/>
            )}
            {(terms.length === 0) && (results.length === 0) && (
                <SearchResultPlaceHolder text={"enter search terms"} />
            )}
            {results.map(({ post, text }, i) => (
                <SearchResult key={i} post={post} terms={terms} text={text}/>
            ))}
        </div>
    );
}
