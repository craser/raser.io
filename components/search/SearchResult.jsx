import styles from "@/components/search/Search.module.scss";
import React from "react";
import { getPostLink } from "@/components/PostLink";
import { useRouter } from "next/router";
import { useSearchContext } from "@/components/search/SearchContext";
import SearchResultMatchedTerms from "@/components/search/SearchResultMatchedTerms";

export default function SearchResult({ terms, post, text }) {
    const searchContext = useSearchContext();
    const router = useRouter();
    const go = () => {
        searchContext.showSearchUi(false);
        router.push(getPostLink(post));
    }

    return (
        <div data-testclass="search-result" className={styles.searchResult} onClick={go}>
            <div className={styles.searchResultTitle}>{post.title}</div>
            <div className={styles.searchResultDate}>{post.datePosted}</div>
            <SearchResultMatchedTerms terms={terms} text={text} />
        </div>
    );
}

