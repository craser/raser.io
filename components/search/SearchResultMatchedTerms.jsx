import styles from "@/components/search/Search.module.scss";

export default function SearchResultMatchedTerms({ terms, text }) {
    const matched = (terms || '')
        .split(/\s+/)
        .filter(t => text.indexOf(t) >= 0);

    return (
        <div className={styles.searchResultMatchedTerms}>
            {matched.map(((term, i) => (<span key={i} className={styles.searchResultTerm}>{term}</span>)))}
        </div>
    );
}
