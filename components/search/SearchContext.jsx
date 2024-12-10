import { createContext, useContext, useEffect, useState } from "react";
import allEntries from './mock-entries';
import search from './SearchImplementation'
import LruCache from "@/lib/cache/LruCache";

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
    const [resultsCache, setResultsCache] = useState(new LruCache(10, { useLocalStorage: false }));
    const [index, setIndex] = useState([]);
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [searchTerms, setSearchTerms] = useState('');
    const [searchResults, setSearchResults] = useState([])
    const [completion, setCompletion] = useState('');

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
        getCompletion: () => completion,
    };

    const onKeyUp = (e) => {
        if (e.key === '/') {
            context.showSearchUi(true);
        }
    };

    const cacheResults = (terms, results) => {
        setResultsCache((cache) => {
            cache.put(terms, results);
            return cache;
        });
    }

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
        if (false && searchTerms && resultsCache.get(searchTerms)) {
            const { results, completion } = resultsCache.get(searchTerms);
            setSearchResults(results);
            setCompletion(completion);
        } else if (searchTerms) {
            const results = search(searchTerms, index);
            setSearchResults(results.results);
            setCompletion(results.completion);
            cacheResults(searchTerms, results);
        } else {
            setSearchResults([]);
            setCompletion('');
        }
    }, [searchTerms]);

    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}
