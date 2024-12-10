import styles from "@/components/search/Search.module.scss";
import React from "react";
import SearchResultMatchedText from "@/components/search/SearchResultMatchedText";
import { getPostLink } from "@/components/PostLink";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SearchResult({ terms, post, text }) {
    const router = useRouter();
    const go = () => router.push(getPostLink(post));

    return (
        <div className={styles.searchResult} onClick={go}>
            <div className={styles.searchResultTitle}>{post.title}</div>
            <div className={styles.searchResultDate}>{post.datePosted}</div>
            <SearchResultMatchedText terms={terms} text={text}/>
        </div>
    );
}

