import { createContext, useContext, useEffect, useState } from "react";
import allEntries from './mock-entries';

function extractText(post) {
    const div = document.createElement('div');
    div.innerHTML = [
        post.intro,
        post.body,
    ].filter(t => t).join(' ');
    const stripped = div.innerText;
    const sanitized = stripped.replaceAll(/\s+/g, ' ');
    return sanitized;
}


const SearchContextObj = createContext({
    showSearchUi: (show) => console.log(`(noop) showSearchContext(${show})`),
    search: (terms) => console.log(`(noop) search("${terms}")`),
})

export function useSearchContext() {
    return useContext(SearchContextObj);
}

export default function SearchContext({ children }) {
    const [index, setIndex] = useState([]);
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [searchTerms, setSearchTerms] = useState('');
    const [searchResults, setSearchResults] = useState([])

    const context = {
        showSearchUi: (show) => {
            console.log(`showSearchUi(${show})`);
            setIsUiVisible(show);
        },
        isUiVisible: () => isUiVisible,
        setSearchTerms: (terms) => {
            console.log(`setSearchTerms("${terms}")`)
            setSearchTerms(terms);
        },
        getSearchTerms: () => searchTerms,
        getSearchResults: () => [...searchResults],
    };

    const onKeyUp = (e) => {
        if (e.key === '/') {
            context.showSearchUi(true);
        }
    };

    useEffect(() => {
        console.log('SearchContext: binding global key listener');
        document.addEventListener('keyup', onKeyUp);
    }, [])

    useEffect(() => {
        let newIndex = allEntries.map(post => ({ post, text: extractText(post) }));
        console.log({ index: newIndex });
        setIndex(newIndex);
    }, []);

    useEffect(() => {
        const bogus = searchTerms.length % 5;
        setSearchResults([index[bogus]]);
    }, [searchTerms]);

    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}
