import styles from './Search.module.scss'

export default function SearchResultMatchedText({ terms, text }) {
    if (!terms) {
        return null;
    }
    const tokens = terms.split(/\s+/);
    const splits = tokens.filter(t => t).reduce((splits, token) => {
        const s = [];
        splits.forEach(split => {
            if (typeof split === 'string') {
                for (let i = split.indexOf(token); i >= 0; i = split.indexOf(token, i)) {
                    s.push(split.substring(0, i));
                    s.push(token);
                    split = split.substring(i + token.length);
                }
                s.push(split); // push remainder
            } else {
                s.push(split);
            }
        })
        return s;
    }, [text]);

    const markedup = splits.map((split, i) => {
        if (tokens.indexOf(split) >= 0) {
            return <span key={i} className={styles.resultTokenMatch}>{split}</span>;
        } else {
            return <span key={i}>{split}</span>
        }
    })

    return (
        <div className={styles.searchResultText}>{markedup}</div>
    )
}

