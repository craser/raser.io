import styles from "@/components/search/Search.module.scss";
import React from "react";
import SearchResultMatchedText from "@/components/search/SearchResultMatchedText";

export default function SearchResult({ terms, post, text }) {
    return (
        <div className={styles.searchResult}>
            <div className={styles.searchResultTitle}>{post.title}</div>
            <div className={styles.searchResultDate}>{post.datePosted}</div>
            <SearchResultMatchedText terms={terms} text={text} />
        </div>
    );
}

