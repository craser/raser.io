import styles from './Search.module.scss'
import React, { useEffect, useRef } from 'react';
import { useSearchContext } from "@/components/search/SearchContext";

export default function SearchInput(props) {
    const searchContext = useSearchContext();
    const typeAheadSuggestion = searchContext.getTypeAheadSuggestion();
    const inputRef = useRef(null);
    const onKeyUp = (e) => {
        e.preventDefault();
        searchContext.setSearchTerms(inputRef.current.value);
    }

    useEffect(() => {
        if (inputRef && inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className={styles.searchInput}>
            <div className={styles.typeAhead}>{typeAheadSuggestion}</div>
            <input ref={inputRef} placeholder={'I want to be'} onKeyUp={onKeyUp} />
        </div>
    );
}
