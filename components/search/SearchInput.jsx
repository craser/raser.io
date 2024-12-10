import styles from './Search.module.scss'
import React, { useEffect, useRef } from 'react';
import { useSearchContext } from "@/components/search/SearchContext";

export default function SearchInput({ setTerms, typeAheadText = '' }) {
    const searchContext = useSearchContext();
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
            <input ref={inputRef} placeholder={'Search'} onKeyUp={onKeyUp} />
            <div className={styles.typeAhead}>{typeAheadText}</div>
        </div>
    );
}
