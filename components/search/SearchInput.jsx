import styles from './Search.module.scss'
import React, { useEffect, useRef } from 'react';
import { useSearchContext } from "@/components/search/SearchContext";

export default function SearchInput(props) {
    const searchContext = useSearchContext();
    const typeAheadSuggestion = searchContext.getTypeAheadSuggestion();
    const inputRef = useRef(null);
    const onKeyUp = (e) => {
        e.preventDefault();
        // listen for tab
        console.log({ keyup: e });
        searchContext.setSearchTerms(inputRef.current.value);
    }

    const onKeyDown = (e) => {
        console.log({ keydown: e });
        if (e.key === 'Tab') {
            e.preventDefault();
            inputRef.current.value = typeAheadSuggestion;
            searchContext.setSearchTerms(typeAheadSuggestion);
        }
    }

    useEffect(() => {
        if (inputRef && inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className={styles.searchInput}>
            <div className={styles.typeAhead}>{typeAheadSuggestion}</div>
            <input ref={inputRef} placeholder={'search...'} onKeyUp={onKeyUp} onKeyDown={onKeyDown} />
        </div>
    );
}
