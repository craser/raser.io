import styles from './Search.module.scss'

export default function SearchResultMatchedText({ terms, text }) {

    const tokens = terms.split(/\s+/);
    const splits = tokens.reduce((splits, token) => {
        const s = [];
        splits.forEach(split => {
            for (let i = split.indexOf(token); i >= 0; i = split.indexOf(token, i)) {
                s.push(split.substring(0, i));
                s.push(token);
                split = split.substring(i + token.length);
            }
        })
        return s;
    }, [text]);

    const markedup = splits.map(split => {
        if (tokens.indexOf(split) >= 0) {
            return (<span class={styles.resultTokenMatch}>{split}</span>);
        } else {
            return split;
        }
    })




    return (
        <div className={styles.searchResultText}>{markedup}</div>
    )
}

