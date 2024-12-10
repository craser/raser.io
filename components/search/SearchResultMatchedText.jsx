import styles from './Search.module.scss'

export default function SearchResultMatchedText({ terms, text }) {
    return (
        <div className={styles.searchResultMatchedText}>{text}</div>
    )
}

