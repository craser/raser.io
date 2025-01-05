import styles from './Search.module.scss'
import React, { useEffect, useRef } from 'react';
import { useSearchContext } from "@/components/search/SearchProvider";

export default function SearchInput(props) {
    const searchContext = useSearchContext();
    const completion = searchContext.getCompletion();
    const searchTerms = searchContext.getSearchTerms();
    const inputRef = useRef(null);
    const onKeyUp = (e) => {
        e.preventDefault();
        console.log({ keyup: e });
        setTimeout(() => searchContext.setSearchTerms(inputRef.current?.value || ''), 0);
    }

    const onKeyDown = (e) => {
        console.log({ keydown: e });
        if (e.key === 'Tab') {
            e.preventDefault();
            inputRef.current.value += completion;
        } else if (e.key === 'n' && e.ctrlKey) {
            e.preventDefault();
            searchContext.selectNextResult();
        } else if (e.key === 'p' && e.ctrlKey) {
            e.preventDefault();
            searchContext.selectPrevResult();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            searchContext.selectNextResult();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            searchContext.selectPrevResult();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            searchContext.goToResult();
        }
    }

    useEffect(() => {
        if (inputRef && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.value = searchTerms;
        }
    }, []);

    return (
        <div className={styles.searchInput}>
            <div className={styles.typeAhead}>
                <span className={styles.existingQuery}>{inputRef.current?.value || searchTerms}</span>
                <span data-testid="search-completion" className={styles.suggestedCompletion}>{completion}</span>
            </div>
            <input type="search" data-testid="search-input" ref={inputRef} placeholder={'search...'} onKeyUp={onKeyUp} onKeyDown={onKeyDown} />
        </div>
    );
}
