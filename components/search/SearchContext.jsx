import { createContext, useContext, useEffect, useState } from "react";
import search from '@/lib/search/SearchImplementation';
import { extractText } from '@/lib/search/TextProcessing';
import LruCache from "@/lib/cache/LruCache";
import PostDao from "@/model/PostDao";

const MIN_SEARCH_TERM_LENGTH = 3;


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
        const start = new Date().getTime();
        new PostDao().getSearchStubs()
            .then(entries => entries.map(post => ({ post, text: extractText(post) })))
            .then(index => {
                console.log(`fetched search stubs in ${new Date().getTime() - start}ms`)
                console.log({ index });
                return index;
            })
            .then(setIndex);
    }, []);

    useEffect(() => {
        if (!searchTerms || searchTerms.length < MIN_SEARCH_TERM_LENGTH) {
            setSearchResults([]);
            setCompletion('');
        } else if (searchTerms && resultsCache.get(searchTerms)) {
            const { results, completion } = resultsCache.get(searchTerms);
            setSearchResults(results);
            setCompletion(completion);
        } else if (searchTerms) {
            const results = search(searchTerms, index);
            setSearchResults(results.results);
            setCompletion(results.completion);
            cacheResults(searchTerms, results);
        }
    }, [searchTerms, index.length]);

    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}
