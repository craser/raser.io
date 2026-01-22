// ABOUTME: Renders search results with terminal-style placeholder messages.
// ABOUTME: Uses ScrambleText for animated text transitions.

import styles from './Search.module.scss'
import React, { useEffect, useRef, useState } from "react";
import { useSearchContext } from "@/components/search/SearchProvider";
import ScrambleText from "@/components/search/ScrambleText";

function SearchResultPlaceHolder({ children }) {
    return (
        <div data-testid="search-placeholder" className={styles.emptySearchResult}>
            <ScrambleText text={children} duration={800} />
        </div>
    )
}

/**
 * @param searchTerms: string
 * @param results: { post, text}[]
 * @param pageSize: number
 * @returns {JSX.Element}
 */
export default function SearchResults() {
    const searchContext = useSearchContext();
    const terms = searchContext.getSearchTerms();
    const results = searchContext.getSearchResults();
    const selectedIndex = searchContext.getSelectedResult();
    const containerRef = useRef();
    const [hasHover, setHasHover] = useState(false);

    useEffect(() => {
        console.log(`keyboard input... removing hover`);
        setHasHover(false);
    }, [terms]);

    useEffect(() => {
        console.log(`selecting item #${selectedIndex}`);
        const prevSelected = containerRef.current.getElementsByClassName(styles.selectedResult).item(0);
        prevSelected?.classList.remove(styles.selectedResult);

        const newSelected = containerRef.current.getElementsByClassName(styles.searchResult).item(selectedIndex);
        newSelected?.classList.add(styles.selectedResult);
        if (!hasHover) {
            console.log(`hasHover: ${hasHover}`);
            newSelected?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        } else {
            console.log(`hasHover: ${hasHover}`);
        }
    }, [selectedIndex]);

    return (
        <div ref={containerRef} data-testid="search-results" className={styles.searchResults}>
            {selectedIndex >= 0 && <SearchResultSelectionIndicator />}
            {(terms.length > 0) && (terms.length >= searchContext.minSearchTermLength) && (results.length === 0) && (
                <SearchResultPlaceHolder>NO MATCHES FOUND</SearchResultPlaceHolder>
            )}
            {(terms.length > 0) && (terms.length < searchContext.minSearchTermLength) && (
                <SearchResultPlaceHolder>SCANNING...</SearchResultPlaceHolder>
            )}
            {(terms.length === 0) && (results.length === 0) && (
                <SearchResultPlaceHolder>AWAITING INPUT...</SearchResultPlaceHolder>
            )}
            {results.map(({ post, text }, i) => (
                <SearchResult data-testclass="search-result" index={i} key={i} post={post} terms={terms} text={text}/>
            ))}
        </div>
    );
}

function SearchResultSelectionIndicator() {
    const searchContext = useSearchContext();
    const selectedIndex = searchContext.getSelectedResult();
    const numResults = searchContext.getSearchResults().length;

    // Format as [001/005] style
    const padNum = (n) => String(n).padStart(3, '0');

    return (
        <div className={styles.selectionIndicator}>
            [{padNum(selectedIndex + 1)}/{padNum(numResults)}]
        </div>
    )
}

export function SearchResult({ terms, post, text, index }) {
    const searchContext = useSearchContext();
    const elementRef = useRef();

    return (
        <div ref={elementRef} data-testclass="search-result" className={styles.searchResult}
             onClick={() => searchContext.goToResult(index)}
        >
            <div className={styles.searchResultTitle}>{post.title}</div>
            <div className={styles.searchResultsMetaData}>
                <SearchResultPostedDate datePosted={post.datePosted}/>
                <SearchResultMatchedTerms terms={terms} text={text}/>
            </div>
        </div>
    );
}

function SearchResultNumber({ number, numResults }) {
    return (
        <div className={styles.resultNumber}>
            <span className={styles.numerator}>{number}</span>
            <span>{numResults}</span>
        </div>
    );
}

function SearchResultPostedDate({ datePosted }) {
    const date = new Date(datePosted);
    // Format as military style: 22-JUN-2024
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const formatted = `${day}-${month}-${year}`;
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
